import { NextRequest, NextResponse } from 'next/server'
import { getOwnedChild, getSessionUser, getServiceClient } from '@/app/api/_utils'

const SIGNED_URL_EXPIRY = 3600 // 1 hour

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const child = await getOwnedChild(id, user.id)
    if (!child) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 })
    }

    const supabase = getServiceClient()
    const { data, error } = await supabase.rpc('get_people_with_mastery', {
      p_child_id: child.id,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Generate signed URLs for photos
    const peopleWithUrls = await Promise.all(
      (data ?? []).map(async (person: {
        id: string
        name: string
        image_path: string | null
        is_distractor: boolean
        mastery: Record<string, { attempts: number; correct: number }>
      }) => {
        let imageUrl: string | undefined

        if (person.image_path) {
          const { data: signedData } = await supabase.storage
            .from('people-photos')
            .createSignedUrl(person.image_path, SIGNED_URL_EXPIRY)
          imageUrl = signedData?.signedUrl
        }

        return {
          id: person.id,
          name: person.name,
          imagePath: person.image_path,
          imageUrl,
          isDistractor: person.is_distractor,
          mastery: person.mastery,
        }
      })
    )

    return NextResponse.json({ people: peopleWithUrls })
  } catch (error) {
    console.error('[People] GET error:', error)
    return NextResponse.json({ error: 'Failed to load people' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const child = await getOwnedChild(id, user.id)
    if (!child) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 })
    }

    const formData = await request.formData()
    const faceId = formData.get('faceId')?.toString()?.trim()
    const name = formData.get('name')?.toString()?.trim()
    const photo = formData.get('photo') as File | null
    const isDistractor = formData.get('isDistractor') === 'true'

    if (!faceId && !name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    if (name && name.length > 50) {
      return NextResponse.json({ error: 'Name must be 50 characters or less' }, { status: 400 })
    }

    const supabase = getServiceClient()
    let imagePath: string | null = null

    if (faceId) {
      const { data: face, error: faceError } = await supabase
        .from('wr_faces')
        .select('id, name, image_path')
        .eq('id', faceId)
        .eq('user_id', user.id)
        .single()

      if (faceError || !face) {
        return NextResponse.json({ error: 'Face not found' }, { status: 404 })
      }

      const { error: linkError } = await supabase
        .from('wr_child_faces')
        .upsert(
          {
            child_id: child.id,
            face_id: face.id,
            is_distractor: isDistractor,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'child_id,face_id',
            ignoreDuplicates: true,
          }
        )

      if (linkError) {
        return NextResponse.json({ error: linkError.message }, { status: 500 })
      }

      let imageUrl: string | undefined
      if (face.image_path) {
        const { data: signedData } = await supabase.storage
          .from('people-photos')
          .createSignedUrl(face.image_path, SIGNED_URL_EXPIRY)
        imageUrl = signedData?.signedUrl
      }

      return NextResponse.json({
        person: {
          id: face.id,
          name: face.name,
          imagePath: face.image_path,
          imageUrl,
          isDistractor,
          mastery: {},
        },
      })
    }

    // Upload photo if provided
    if (photo && photo.size > 0) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
      if (!allowedTypes.includes(photo.type)) {
        return NextResponse.json(
          { error: 'Invalid file type. Please upload a JPEG, PNG, or WebP image.' },
          { status: 400 }
        )
      }

      // Validate file size (5MB max)
      const maxSize = 5 * 1024 * 1024
      if (photo.size > maxSize) {
        return NextResponse.json(
          { error: 'Image too large. Maximum size is 5MB.' },
          { status: 400 }
        )
      }

      // Generate unique filename
      const ext = photo.name.split('.').pop()?.toLowerCase() || 'jpg'
      const filename = `${user.id}/${crypto.randomUUID()}.${ext}`

      // Upload to Supabase Storage
      const buffer = Buffer.from(await photo.arrayBuffer())
      const { error: uploadError } = await supabase.storage
        .from('people-photos')
        .upload(filename, buffer, {
          contentType: photo.type,
          upsert: false,
        })

      if (uploadError) {
        console.error('[People] Upload error:', uploadError)
        return NextResponse.json(
          { error: 'Failed to upload photo' },
          { status: 500 }
        )
      }

      imagePath = filename
    }

    // Insert face record
    const { data: face, error: insertError } = await supabase
      .from('wr_faces')
      .insert({
        user_id: user.id,
        name,
        image_path: imagePath,
      })
      .select('id, name, image_path')
      .single()

    if (insertError) {
      // Clean up uploaded photo if insert fails
      if (imagePath) {
        await supabase.storage.from('people-photos').remove([imagePath])
      }
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    const { error: linkError } = await supabase
      .from('wr_child_faces')
      .insert({
        child_id: child.id,
        face_id: face.id,
        is_distractor: isDistractor,
      })

    if (linkError) {
      if (imagePath) {
        await supabase.storage.from('people-photos').remove([imagePath])
      }
      await supabase.from('wr_faces').delete().eq('id', face.id)
      return NextResponse.json({ error: linkError.message }, { status: 500 })
    }

    // Generate signed URL for the uploaded photo
    let imageUrl: string | undefined
    if (imagePath) {
      const { data: signedData } = await supabase.storage
        .from('people-photos')
        .createSignedUrl(imagePath, SIGNED_URL_EXPIRY)
      imageUrl = signedData?.signedUrl
    }

    return NextResponse.json({
      person: {
        id: face.id,
        name: face.name,
        imagePath: face.image_path,
        imageUrl,
        isDistractor,
        mastery: {},
      },
    })
  } catch (error) {
    console.error('[People] POST error:', error)
    return NextResponse.json({ error: 'Failed to add person' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const child = await getOwnedChild(id, user.id)
    if (!child) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 })
    }

    const body = (await request.json()) as { personId?: string }
    const personId = body.personId?.trim()
    if (!personId) {
      return NextResponse.json({ error: 'personId is required' }, { status: 400 })
    }

    const supabase = getServiceClient()

    // Unlink the face from this child
    const { error: deleteError } = await supabase
      .from('wr_child_faces')
      .delete()
      .eq('face_id', personId)
      .eq('child_id', child.id)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[People] DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete person' }, { status: 500 })
  }
}

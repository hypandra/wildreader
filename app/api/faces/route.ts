import { NextRequest, NextResponse } from "next/server"
import { getSessionUser, getServiceClient } from "@/app/api/_utils"

const SIGNED_URL_EXPIRY = 3600

export async function GET() {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = getServiceClient()
    const { data, error } = await supabase
      .from("wr_faces")
      .select("id, name, image_path")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const facesWithUrls = await Promise.all(
      (data ?? []).map(async (face: { id: string; name: string; image_path: string | null }) => {
        let imageUrl: string | undefined
        if (face.image_path) {
          const { data: signedData } = await supabase.storage
            .from("people-photos")
            .createSignedUrl(face.image_path, SIGNED_URL_EXPIRY)
          imageUrl = signedData?.signedUrl
        }

        return {
          id: face.id,
          name: face.name,
          imagePath: face.image_path,
          imageUrl,
        }
      })
    )

    return NextResponse.json({ faces: facesWithUrls })
  } catch (error) {
    console.error("[Faces] GET error:", error)
    return NextResponse.json({ error: "Failed to load faces" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const name = formData.get("name")?.toString()?.trim()
    const photo = formData.get("photo") as File | null

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    if (name.length > 50) {
      return NextResponse.json({ error: "Name must be 50 characters or less" }, { status: 400 })
    }

    const supabase = getServiceClient()
    let imagePath: string | null = null

    if (photo && photo.size > 0) {
      const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]
      if (!allowedTypes.includes(photo.type)) {
        return NextResponse.json(
          { error: "Invalid file type. Please upload a JPEG, PNG, or WebP image." },
          { status: 400 }
        )
      }

      const maxSize = 5 * 1024 * 1024
      if (photo.size > maxSize) {
        return NextResponse.json(
          { error: "Image too large. Maximum size is 5MB." },
          { status: 400 }
        )
      }

      const ext = photo.name.split(".").pop()?.toLowerCase() || "jpg"
      const filename = `${user.id}/${crypto.randomUUID()}.${ext}`
      const buffer = Buffer.from(await photo.arrayBuffer())
      const { error: uploadError } = await supabase.storage
        .from("people-photos")
        .upload(filename, buffer, {
          contentType: photo.type,
          upsert: false,
        })

      if (uploadError) {
        console.error("[Faces] Upload error:", uploadError)
        return NextResponse.json({ error: "Failed to upload photo" }, { status: 500 })
      }

      imagePath = filename
    }

    const { data: face, error: insertError } = await supabase
      .from("wr_faces")
      .insert({
        user_id: user.id,
        name,
        image_path: imagePath,
      })
      .select("id, name, image_path")
      .single()

    if (insertError) {
      if (imagePath) {
        await supabase.storage.from("people-photos").remove([imagePath])
      }
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    let imageUrl: string | undefined
    if (imagePath) {
      const { data: signedData } = await supabase.storage
        .from("people-photos")
        .createSignedUrl(imagePath, SIGNED_URL_EXPIRY)
      imageUrl = signedData?.signedUrl
    }

    return NextResponse.json({
      face: {
        id: face.id,
        name: face.name,
        imagePath: face.image_path,
        imageUrl,
      },
    })
  } catch (error) {
    console.error("[Faces] POST error:", error)
    return NextResponse.json({ error: "Failed to add face" }, { status: 500 })
  }
}

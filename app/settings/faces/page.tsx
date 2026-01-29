/* eslint-disable @next/next/no-img-element */
"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Plus, Trash2, Users, Shield, Camera, Loader2, Pencil, UserPlus, UserMinus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useSession } from "@/lib/auth-client"
import { useChild } from "@/lib/contexts/ChildContext"
import { getPeopleWithMastery, addPerson, deletePerson, linkPersonToChild } from "@/lib/db/people"
import { getFaceLibrary, updateFace, deleteFace } from "@/lib/db/faces"
import { MobileNav } from "@/components/MobileNav"
import type { Face, Person } from "@/types"

export default function FacesSettingsPage() {
  const router = useRouter()
  const { data: session, isPending } = useSession()
  const { activeChildId, children } = useChild()
  const activeChild = children.find(c => c.id === activeChildId)

  const [loading, setLoading] = useState(true)
  const [people, setPeople] = useState<Person[]>([])
  const [faces, setFaces] = useState<Face[]>([])
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [faceToEdit, setFaceToEdit] = useState<Face | null>(null)
  const [personToDelete, setPersonToDelete] = useState<Person | null>(null)
  const [newName, setNewName] = useState("")
  const [newPhoto, setNewPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editPhoto, setEditPhoto] = useState<File | null>(null)
  const [editPhotoPreview, setEditPhotoPreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editError, setEditError] = useState<string | null>(null)
  const [linkingFaceId, setLinkingFaceId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const editFileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function loadPeople() {
      if (isPending) return

      if (!session?.user) {
        router.push('/login')
        return
      }

      if (!activeChildId) {
        router.push('/select-child')
        return
      }

      try {
        const [peopleData, faceData] = await Promise.all([
          getPeopleWithMastery(activeChildId),
          getFaceLibrary(),
        ])
        setPeople(peopleData)
        setFaces(faceData)
      } catch (err) {
        console.error('Failed to load people:', err)
      } finally {
        setLoading(false)
      }
    }

    loadPeople()
  }, [session, activeChildId, isPending, router])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setNewPhoto(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setEditPhoto(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setEditPhotoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAddPerson = async () => {
    if (!newName.trim() || !activeChildId) return

    setSubmitting(true)
    setError(null)

    try {
      const person = await addPerson(activeChildId, newName.trim(), newPhoto ?? undefined)
      setPeople((prev) => [...prev, person])
      setFaces((prev) => {
        if (prev.some((face) => face.id === person.id)) return prev
        return [
          ...prev,
          {
            id: person.id,
            name: person.name,
            imagePath: person.imagePath,
            imageUrl: person.imageUrl,
          },
        ]
      })
      setAddDialogOpen(false)
      setNewName("")
      setNewPhoto(null)
      setPhotoPreview(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add person")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeletePerson = async () => {
    if (!personToDelete || !activeChildId) return

    setSubmitting(true)
    try {
      await deletePerson(activeChildId, personToDelete.id)
      setPeople((prev) => prev.filter((p) => p.id !== personToDelete.id))
      setDeleteDialogOpen(false)
      setPersonToDelete(null)
    } catch (err) {
      console.error('Failed to delete person:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleLinkFace = async (face: Face) => {
    if (!activeChildId) return

    setLinkingFaceId(face.id)
    try {
      const person = await linkPersonToChild(activeChildId, face.id)
      setPeople((prev) => {
        if (prev.some((p) => p.id === person.id)) return prev
        return [...prev, person]
      })
    } catch (err) {
      console.error("Failed to add face to child:", err)
    } finally {
      setLinkingFaceId(null)
    }
  }

  const handleUnlinkFace = async (faceId: string) => {
    if (!activeChildId) return

    setSubmitting(true)
    try {
      await deletePerson(activeChildId, faceId)
      setPeople((prev) => prev.filter((p) => p.id !== faceId))
    } catch (err) {
      console.error("Failed to remove face from child:", err)
    } finally {
      setSubmitting(false)
    }
  }

  const openEditDialog = (face: Face) => {
    setFaceToEdit(face)
    setEditName(face.name)
    setEditPhoto(null)
    setEditPhotoPreview(face.imageUrl || null)
    setEditError(null)
    setEditDialogOpen(true)
  }

  const handleUpdateFace = async () => {
    if (!faceToEdit) return

    setSubmitting(true)
    setEditError(null)

    try {
      const updated = await updateFace(faceToEdit.id, {
        name: editName.trim() ? editName.trim() : faceToEdit.name,
        photo: editPhoto,
      })

      setFaces((prev) =>
        prev.map((face) => (face.id === updated.id ? updated : face))
      )
      setPeople((prev) =>
        prev.map((person) =>
          person.id === updated.id
            ? {
                ...person,
                name: updated.name,
                imagePath: updated.imagePath,
                imageUrl: updated.imageUrl,
              }
            : person
        )
      )

      setEditDialogOpen(false)
      setFaceToEdit(null)
      setEditPhoto(null)
      setEditPhotoPreview(null)
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Failed to update face")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteFace = async () => {
    if (!faceToEdit) return

    setSubmitting(true)
    setEditError(null)

    try {
      await deleteFace(faceToEdit.id)
      setFaces((prev) => prev.filter((face) => face.id !== faceToEdit.id))
      setPeople((prev) => prev.filter((person) => person.id !== faceToEdit.id))
      setEditDialogOpen(false)
      setFaceToEdit(null)
      setEditPhoto(null)
      setEditPhotoPreview(null)
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Failed to delete face")
    } finally {
      setSubmitting(false)
    }
  }

  const peopleWithPhotos = people.filter((p) => p.imageUrl && !p.isDistractor)
  const childFaceIds = new Set(people.map((p) => p.id))

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl animate-bounce-soft mb-4">👤</div>
          <p className="text-2xl font-display text-bark">Loading faces...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative">
      {/* Mobile navigation bar */}
      <MobileNav />

      {/* Subtle decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[10%] right-[5%] text-2xl animate-float-slow opacity-30">👤</div>
        <div className="absolute bottom-[20%] left-[5%] text-xl animate-twinkle delay-300 opacity-25">📷</div>
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-8 pt-16 sm:pt-8">
        {/* Header */}
        <header className="flex items-center gap-4 mb-8 animate-slide-up">
          <Link href="/settings">
            <Button
              variant="ghost"
              size="icon"
              className="h-12 w-12 rounded-2xl hover:bg-coral/10 hover:text-coral transition-all duration-200"
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-coral" />
            <div>
              <h1 className="text-3xl md:text-4xl font-display font-bold text-bark">
                Face Match
              </h1>
              {activeChild && (
                <p className="text-sm text-muted-foreground">
                  Managing faces for {activeChild.name}
                </p>
              )}
            </div>
          </div>
        </header>

        <div className="space-y-6">
          {/* Privacy Notice */}
          <div className="bg-sage/10 border-2 border-sage/20 rounded-2xl p-4 animate-pop-in">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-sage/20 rounded-xl">
                <Shield className="h-5 w-5 text-sage" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-sage mb-1">Private & Secure</p>
                <p className="text-sm text-muted-foreground">
                  Photos are stored privately and only accessible to your account.
                  They are never shared or used for any other purpose.
                </p>
              </div>
            </div>
          </div>

          {/* Faces for this child */}
          <div className="bg-card/80 backdrop-blur-sm rounded-3xl border-2 border-border shadow-soft overflow-hidden animate-pop-in delay-100">
            <div className="bg-gradient-to-r from-coral/20 to-rose-50 px-6 py-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-coral/30 rounded-xl">
                  <Camera className="h-5 w-5 text-coral" />
                </div>
                <h2 className="text-xl font-display font-bold text-bark">
                  Faces for {activeChild?.name || "this child"} ({peopleWithPhotos.length})
                </h2>
              </div>
              <Button
                onClick={() => setAddDialogOpen(true)}
                className="rounded-xl bg-gradient-to-r from-coral to-rose-500 text-white hover:shadow-md transition-all duration-200"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Face
              </Button>
            </div>

            <div className="p-6">
              {peopleWithPhotos.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-5xl mb-4">👤</div>
                  <p className="text-lg font-semibold text-bark mb-2">No faces added yet</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add photos of family members, friends, or pets to start playing Face Match!
                  </p>
                  <Button
                    onClick={() => setAddDialogOpen(true)}
                    className="rounded-xl bg-gradient-to-r from-coral to-rose-500 text-white hover:shadow-md"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Face
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {peopleWithPhotos.map((person) => (
                    <div
                      key={person.id}
                      className="relative group bg-white rounded-2xl border-2 border-border overflow-hidden shadow-soft hover:shadow-md transition-all duration-200"
                    >
                      {person.imageUrl ? (
                        <div className="aspect-square">
                          <img
                            src={person.imageUrl}
                            alt={person.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="aspect-square flex items-center justify-center bg-muted text-4xl">
                          👤
                        </div>
                      )}
                      <div className="p-3 bg-white">
                        <p className="font-semibold text-bark text-center truncate">
                          {person.name}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setPersonToDelete(person)
                          setDeleteDialogOpen(true)
                        }}
                        className="absolute top-2 right-2 p-2 bg-white/90 rounded-full opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
                      >
                        <UserMinus className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Face Library */}
          <div className="bg-card/80 backdrop-blur-sm rounded-3xl border-2 border-border shadow-soft overflow-hidden animate-pop-in delay-150">
            <div className="bg-gradient-to-r from-sunshine/20 to-amber-50 px-6 py-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-sunshine/30 rounded-xl">
                  <Users className="h-5 w-5 text-sunshine" />
                </div>
                <h2 className="text-xl font-display font-bold text-bark">
                  Face Library ({faces.length})
                </h2>
              </div>
            </div>

            <div className="p-6">
              {faces.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-5xl mb-4">📸</div>
                  <p className="text-lg font-semibold text-bark mb-2">No faces in your library</p>
                  <p className="text-sm text-muted-foreground">
                    Add faces above to build a reusable library for all your children.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {faces.map((face) => {
                    const isLinked = childFaceIds.has(face.id)
                    const isLinking = linkingFaceId === face.id

                    return (
                      <div
                        key={face.id}
                        className="relative group bg-white rounded-2xl border-2 border-border overflow-hidden shadow-soft hover:shadow-md transition-all duration-200"
                      >
                        {face.imageUrl ? (
                          <div className="aspect-square">
                            <img
                              src={face.imageUrl}
                              alt={face.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="aspect-square flex items-center justify-center bg-muted text-4xl">
                            👤
                          </div>
                        )}
                        <div className="p-3 bg-white">
                          <p className="font-semibold text-bark text-center truncate">
                            {face.name}
                          </p>
                          <div className="mt-2 flex items-center justify-center gap-2">
                            <Button
                              onClick={() => (isLinked ? handleUnlinkFace(face.id) : handleLinkFace(face))}
                              variant={isLinked ? "outline" : "default"}
                              size="sm"
                              disabled={isLinking || submitting}
                              className={isLinked ? "rounded-lg" : "rounded-lg bg-sunshine text-bark hover:bg-amber-300"}
                            >
                              {isLinked ? (
                                <>
                                  <UserMinus className="h-4 w-4 mr-1" />
                                  Remove
                                </>
                              ) : (
                                <>
                                  <UserPlus className="h-4 w-4 mr-1" />
                                  Add
                                </>
                              )}
                            </Button>
                            <Button
                              onClick={() => openEditDialog(face)}
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-lg"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Play Game Link */}
          {peopleWithPhotos.length > 0 && (
            <div className="animate-pop-in delay-200">
              <Link href="/game/face-match">
                <Button
                  className="w-full h-14 text-lg font-display font-bold rounded-2xl bg-gradient-to-r from-sunshine to-amber-400 text-bark hover:from-amber-400 hover:to-sunshine shadow-tactile hover:shadow-lg transition-all duration-300"
                >
                  Play Face Match! 👤
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Add Face Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-md rounded-3xl border-2 border-border">
          <DialogHeader>
            <DialogTitle className="text-2xl font-display font-bold text-bark">
              Add a Face
            </DialogTitle>
            <DialogDescription>
              Add a family member, friend, or pet. This face can be reused across all children.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Photo Upload */}
            <div className="text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                onChange={handleFileChange}
                className="hidden"
              />
              {photoPreview ? (
                <div className="relative inline-block">
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="w-32 h-32 object-cover rounded-2xl border-2 border-border"
                  />
                  <button
                    onClick={() => {
                      setNewPhoto(null)
                      setPhotoPreview(null)
                    }}
                    className="absolute -top-2 -right-2 p-1 bg-white rounded-full border-2 border-border hover:bg-destructive/10 hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-32 h-32 mx-auto rounded-2xl border-2 border-dashed border-border bg-muted/30 hover:bg-muted/50 hover:border-coral transition-colors flex flex-col items-center justify-center gap-2"
                >
                  <Camera className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Add Photo</span>
                </button>
              )}
            </div>

            {/* Name Input */}
            <div>
              <label className="text-sm font-semibold text-bark block mb-2">
                Name
              </label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g., Grandma, Uncle Joe, Buddy"
                className="h-12 rounded-xl border-2"
                maxLength={50}
              />
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-2 text-center">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <Button
              onClick={handleAddPerson}
              disabled={!newName.trim() || submitting}
              className="w-full h-12 rounded-xl font-display font-bold bg-gradient-to-r from-coral to-rose-500 text-white hover:shadow-md transition-all duration-200"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5 mr-2" />
                  Add Face
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-3xl border-2 border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-display font-bold text-bark">
              Remove {personToDelete?.name} from this child?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This face will stay in your library for other children.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePerson}
              disabled={submitting}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {submitting ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Face Dialog */}
      <Dialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open)
          if (!open) {
            setFaceToEdit(null)
            setEditPhoto(null)
            setEditPhotoPreview(null)
            setEditError(null)
          }
        }}
      >
        <DialogContent className="max-w-md rounded-3xl border-2 border-border">
          <DialogHeader>
            <DialogTitle className="text-2xl font-display font-bold text-bark">
              Edit Face
            </DialogTitle>
            <DialogDescription>
              Updates will apply to every child using this face.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="text-center">
              <input
                ref={editFileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                onChange={handleEditFileChange}
                className="hidden"
              />
              {editPhotoPreview ? (
                <div className="relative inline-block">
                  <img
                    src={editPhotoPreview}
                    alt="Preview"
                    className="w-32 h-32 object-cover rounded-2xl border-2 border-border"
                  />
                  <button
                    onClick={() => {
                      setEditPhoto(null)
                      setEditPhotoPreview(faceToEdit?.imageUrl || null)
                    }}
                    className="absolute -top-2 -right-2 p-1 bg-white rounded-full border-2 border-border hover:bg-destructive/10 hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => editFileInputRef.current?.click()}
                  className="w-32 h-32 mx-auto rounded-2xl border-2 border-dashed border-border bg-muted/30 hover:bg-muted/50 hover:border-coral transition-colors flex flex-col items-center justify-center gap-2"
                >
                  <Camera className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Change Photo</span>
                </button>
              )}
            </div>

            <div>
              <label className="text-sm font-semibold text-bark block mb-2">
                Name
              </label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="e.g., Grandma, Uncle Joe, Buddy"
                className="h-12 rounded-xl border-2"
                maxLength={50}
              />
            </div>

            {editError && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-2 text-center">
                <p className="text-sm text-destructive">{editError}</p>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={handleUpdateFace}
                disabled={!editName.trim() || submitting}
                className="flex-1 h-12 rounded-xl font-display font-bold bg-gradient-to-r from-sunshine to-amber-400 text-bark hover:shadow-md transition-all duration-200"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Pencil className="h-5 w-5 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
              <Button
                onClick={handleDeleteFace}
                disabled={submitting}
                variant="outline"
                className="flex-1 h-12 rounded-xl border-2 border-destructive/40 text-destructive hover:bg-destructive/10"
              >
                {submitting ? "Deleting..." : "Delete Face"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

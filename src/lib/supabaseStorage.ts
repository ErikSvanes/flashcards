// src/lib/supabaseStorage.ts
import { createClient } from './supabase'
import { Set, Card, Folder } from './storage'

/** ---- SUPABASE SET HELPERS ---- **/

export async function getSupabaseSets(): Promise<Set[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return []

  const { data: sets, error } = await supabase
    .from('study_sets')
    .select(`
      id,
      name,
      description,
      parent_id,
      cards!inner (
        id,
        term,
        definition,
        term_image,
        definition_image,
        is_markdown,
        created_at
      )
    `)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error fetching sets:', error)
    return []
  }

  // Transform Supabase data to match our Set interface
  return (sets || []).map(set => ({
    id: set.id,
    name: set.name,
    description: set.description || undefined,
    parentId: set.parent_id,
    cards: (set.cards || [])
      .sort((a: any, b: any) => {
        // Sort by created_at to maintain insertion order
        const timeA = new Date(a.created_at).getTime();
        const timeB = new Date(b.created_at).getTime();
        return timeA - timeB;
      })
      .map((card: any) => ({
        id: card.id,
        term: card.term,
        definition: card.definition,
        termImage: card.term_image || undefined,
        definitionImage: card.definition_image || undefined,
        isMarkdown: card.is_markdown || undefined,
      })),
  }))
}

export async function addSupabaseSet(id: string, name: string, parentId: string | null, description = ''): Promise<Set | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data, error } = await supabase
    .from('study_sets')
    .insert({
      id, // Client-provided UUID
      user_id: user.id,
      name,
      description,
      parent_id: parentId,
    })
    .select()
    .single()

  if (error) {
    console.error('Error adding set:', error)
    return null
  }

  return {
    id: data.id,
    name: data.name,
    description: data.description || undefined,
    parentId: data.parent_id,
    cards: [],
  }
}

export async function updateSupabaseSet(setId: string, updates: Partial<Set>): Promise<boolean> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return false

  const dbUpdates: any = {}
  if (updates.name !== undefined) dbUpdates.name = updates.name
  if (updates.description !== undefined) dbUpdates.description = updates.description
  if (updates.parentId !== undefined) dbUpdates.parent_id = updates.parentId

  const { error } = await supabase
    .from('study_sets')
    .update(dbUpdates)
    .eq('id', setId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error updating set:', error)
    return false
  }

  return true
}

export async function deleteSupabaseSet(setId: string): Promise<boolean> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return false

  const { error } = await supabase
    .from('study_sets')
    .delete()
    .eq('id', setId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error deleting set:', error)
    return false
  }

  return true
}

/** ---- SUPABASE CARD HELPERS ---- **/

export async function addSupabaseCard(
  id: string,
  setId: string,
  term: string,
  definition: string
): Promise<Card | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Verify the set belongs to the user
  const { data: set } = await supabase
    .from('study_sets')
    .select('id')
    .eq('id', setId)
    .eq('user_id', user.id)
    .single()

  if (!set) return null

  const { data, error } = await supabase
    .from('cards')
    .insert({
      id, // Client-provided UUID
      study_set_id: setId,
      term,
      definition,
    })
    .select()
    .single()

  if (error) {
    console.error('Error adding card:', error)
    return null
  }

  return {
    id: data.id,
    term: data.term,
    definition: data.definition,
    termImage: data.term_image || undefined,
    definitionImage: data.definition_image || undefined,
    isMarkdown: data.is_markdown || undefined,
  }
}

export async function editSupabaseCard(setId: string, updatedCard: Card): Promise<boolean> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return false

  const { error } = await supabase
    .from('cards')
    .update({
      term: updatedCard.term,
      definition: updatedCard.definition,
      term_image: updatedCard.termImage || null,
      definition_image: updatedCard.definitionImage || null,
      is_markdown: updatedCard.isMarkdown || false,
    })
    .eq('id', updatedCard.id)
    .eq('study_set_id', setId)

  if (error) {
    console.error('Error editing card:', error)
    return false
  }

  return true
}

export async function deleteSupabaseCard(setId: string, cardId: string): Promise<boolean> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return false

  const { error } = await supabase
    .from('cards')
    .delete()
    .eq('id', cardId)
    .eq('study_set_id', setId)

  if (error) {
    console.error('Error deleting card:', error)
    return false
  }

  return true
}

/** ---- SUPABASE FOLDER HELPERS ---- **/

export async function getSupabaseFolders(): Promise<Folder[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return []

  const { data: folders, error } = await supabase
    .from('folders')
    .select('*')
    .eq('user_id', user.id)

  if (error) {
    console.error('Error fetching folders:', error)
    return []
  }

  return (folders || []).map(folder => ({
    id: folder.id,
    name: folder.name,
    description: folder.description || undefined,
    parentId: folder.parent_id,
  }))
}

export async function addSupabaseFolder(
  id: string,
  name: string,
  parentId: string | null,
  description = ''
): Promise<Folder | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data, error } = await supabase
    .from('folders')
    .insert({
      id, // Client-provided UUID
      user_id: user.id,
      name,
      description,
      parent_id: parentId,
    })
    .select()
    .single()

  if (error) {
    console.error('Error adding folder:', error)
    return null
  }

  return {
    id: data.id,
    name: data.name,
    description: data.description || undefined,
    parentId: data.parent_id,
  }
}

export async function updateSupabaseFolder(folderId: string, updates: Partial<Folder>): Promise<boolean> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return false

  const dbUpdates: any = {}
  if (updates.name !== undefined) dbUpdates.name = updates.name
  if (updates.description !== undefined) dbUpdates.description = updates.description
  if (updates.parentId !== undefined) dbUpdates.parent_id = updates.parentId

  const { error } = await supabase
    .from('folders')
    .update(dbUpdates)
    .eq('id', folderId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error updating folder:', error)
    return false
  }

  return true
}

export async function deleteSupabaseFolder(folderId: string): Promise<boolean> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return false

  const { error } = await supabase
    .from('folders')
    .delete()
    .eq('id', folderId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error deleting folder:', error)
    return false
  }

  return true
}

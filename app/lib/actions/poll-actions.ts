"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Create a new poll owned by the authenticated user.
 * Why: Validates and normalizes input server-side to keep client logic minimal and prevent oversized/invalid records.
 */
// CREATE POLL
export async function createPoll(formData: FormData) {
  const supabase = await createClient();

  const rawQuestion = (formData.get("question") as string) ?? "";
  const rawOptions = formData.getAll("options").filter(Boolean) as string[];

  const question = rawQuestion.trim();
  const options = rawOptions
    .map((opt) => (typeof opt === "string" ? opt.trim() : ""))
    .filter((opt) => opt.length > 0)
    .slice(0, 10); // prevent excessive options

  if (!question || question.length > 300 || options.length < 2) {
    return { error: "Provide a question (<=300 chars) and at least two options (max 10)." };
  }

  // Get user from session
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) {
    return { error: userError.message };
  }
  if (!user) {
    return { error: "You must be logged in to create a poll." };
  }

  const { error } = await supabase.from("polls").insert([
    {
      user_id: user.id,
      question,
      options,
    },
  ]);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/polls");
  return { error: null };
}

/**
 * Retrieve all polls for the current authenticated user.
 * Why: Keeps access scoped to the owner to avoid data leaks.
 */
// GET USER POLLS
export async function getUserPolls() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { polls: [], error: "Not authenticated" };

  const { data, error } = await supabase
    .from("polls")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return { polls: [], error: error.message };
  return { polls: data ?? [], error: null };
}

/**
 * Fetch a poll by id.
 * Why: Used for public viewing / voting flows; keep return value minimal.
 */
// GET POLL BY ID
export async function getPollById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("polls")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return { poll: null, error: error.message };
  return { poll: data, error: null };
}

/**
 * Submit a vote for a specific poll option.
 * Why: Requires authentication and enforces single vote per user per poll.
 */
// SUBMIT VOTE
export async function submitVote(pollId: string, optionIndex: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Require login to vote to ensure per-user uniqueness and accountability
  if (!user) return { error: "You must be logged in to vote." };

  // Validate poll and option index
  const { data: poll, error: pollError } = await supabase
    .from("polls")
    .select("id, options")
    .eq("id", pollId)
    .single();
  if (pollError || !poll) return { error: pollError?.message ?? "Poll not found" };

  if (
    typeof optionIndex !== "number" ||
    !Number.isInteger(optionIndex) ||
    optionIndex < 0 ||
    optionIndex >= (poll.options as unknown[]).length
  ) {
    return { error: "Invalid option selected." };
  }

  // Prevent duplicate votes by the same user on the same poll
  const { data: existingVote, error: existingError } = await supabase
    .from("votes")
    .select("id")
    .eq("poll_id", pollId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (existingError) return { error: existingError.message };
  if (existingVote) return { error: "You have already voted on this poll." };

  const { error } = await supabase.from("votes").insert([
    {
      poll_id: pollId,
      user_id: user.id,
      option_index: optionIndex,
    },
  ]);

  if (error) return { error: error.message };
  return { error: null };
}

/**
 * Delete a poll owned by the current user.
 * Why: Enforces ownership at the application level; pair with DB/RLS for defense in depth.
 */
// DELETE POLL
export async function deletePoll(id: string) {
  const supabase = await createClient();

  // Enforce ownership: only the poll owner can delete
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error, count } = await supabase
    .from("polls")
    .delete({ count: "exact" })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  if ((count ?? 0) === 0) return { error: "Poll not found or not owned by you" };

  revalidatePath("/polls");
  return { error: null };
}

/**
 * Update a poll owned by the current user.
 * Why: Normalizes input and restricts edits to owner.
 */
// UPDATE POLL
export async function updatePoll(pollId: string, formData: FormData) {
  const supabase = await createClient();

  const rawQuestion = (formData.get("question") as string) ?? "";
  const rawOptions = formData.getAll("options").filter(Boolean) as string[];

  const question = rawQuestion.trim();
  const options = rawOptions
    .map((opt) => (typeof opt === "string" ? opt.trim() : ""))
    .filter((opt) => opt.length > 0)
    .slice(0, 10);

  if (!question || question.length > 300 || options.length < 2) {
    return { error: "Provide a question (<=300 chars) and at least two options (max 10)." };
  }

  // Get user from session
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) {
    return { error: userError.message };
  }
  if (!user) {
    return { error: "You must be logged in to update a poll." };
  }

  // Only allow updating polls owned by the user
  const { error } = await supabase
    .from("polls")
    .update({ question, options })
    .eq("id", pollId)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

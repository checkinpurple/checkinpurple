import { RequestHandler } from "express";
import { supabase } from "../lib/supabase";
import { Follow, Like, Comment, FollowRequest, LikeRequest, CommentRequest } from "@shared/api";
import { notifyNewFollower } from "./notifications";

// Get follows for a user
export const getFollows: RequestHandler = async (req, res) => {
  try {
    const userId = req.query.user_id as string;
    if (!userId) {
      return res.status(400).json({ error: "user_id required" });
    }

    const { data, error } = await supabase
      .from("follows")
      .select("followed_id, users!follows_followed_id_fkey(id, username, avatar_url)")
      .eq("follower_id", userId);

    if (error) throw error;
    res.json({ success: true, following: (data || []).map((follow: any) => follow.users).filter(Boolean) });
  } catch (error) {
    console.error("Error getting follows:", error);
    res.status(500).json({ error: "Failed to get follows" });
  }
};

// Follow a user
export const followUser: RequestHandler = async (req, res) => {
  try {
    const { followed_id }: FollowRequest = req.body;
    const follower_id = req.user?.id;

    if (!follower_id || !followed_id) {
      return res.status(400).json({ error: "Invalid request" });
    }

    const { data, error } = await supabase
      .from("follows")
      .insert({ follower_id, followed_id })
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error("Error following user:", error);
    res.status(500).json({ error: "Failed to follow user" });
  }
};

// Unfollow a user
export const unfollowUser: RequestHandler = async (req, res) => {
  try {
    const { followed_id }: FollowRequest = req.body;
    const follower_id = req.user?.id;

    if (!follower_id || !followed_id) {
      return res.status(400).json({ error: "Invalid request" });
    }

    const { error } = await supabase
      .from("follows")
      .delete()
      .eq("follower_id", follower_id)
      .eq("followed_id", followed_id);

    if (error) throw error;
    // Notify the person being followed
    try {
      const { data: follower } = await supabase.from("users").select("username").eq("id", follower_id).single();
      await notifyNewFollower(followed_id, follower?.username || "Someone");
    } catch {}

    res.json({ success: true });
  } catch (error) {
    console.error("Error unfollowing user:", error);
    res.status(500).json({ error: "Failed to unfollow user" });
  }
};

// Get likes for a stream
export const getLikes: RequestHandler = async (req, res) => {
  try {
    const streamId = req.query.stream_id as string;
    if (!streamId) {
      return res.status(400).json({ error: "stream_id required" });
    }

    const { data, error } = await supabase
      .from("likes")
      .select("*")
      .eq("stream_id", streamId);

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error("Error getting likes:", error);
    res.status(500).json({ error: "Failed to get likes" });
  }
};

// Like a stream
export const likeStream: RequestHandler = async (req, res) => {
  try {
    const { stream_id }: LikeRequest = req.body;
    const user_id = req.user?.id;

    if (!user_id || !stream_id) {
      return res.status(400).json({ error: "Invalid request" });
    }

    const { data, error } = await supabase
      .from("likes")
      .insert({ user_id, stream_id })
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error("Error liking stream:", error);
    res.status(500).json({ error: "Failed to like stream" });
  }
};

// Unlike a stream
export const unlikeStream: RequestHandler = async (req, res) => {
  try {
    const { stream_id }: LikeRequest = req.body;
    const user_id = req.user?.id;

    if (!user_id || !stream_id) {
      return res.status(400).json({ error: "Invalid request" });
    }

    const { error } = await supabase
      .from("likes")
      .delete()
      .eq("user_id", user_id)
      .eq("stream_id", stream_id);

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    console.error("Error unliking stream:", error);
    res.status(500).json({ error: "Failed to unlike stream" });
  }
};

// Get comments for a stream
export const getComments: RequestHandler = async (req, res) => {
  try {
    const streamId = req.query.stream_id as string;
    if (!streamId) {
      return res.status(400).json({ error: "stream_id required" });
    }

    const { data, error } = await supabase
      .from("comments")
      .select(`
        *,
        users!inner(username)
      `)
      .eq("stream_id", streamId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error("Error getting comments:", error);
    res.status(500).json({ error: "Failed to get comments" });
  }
};

// Add a comment
export const addComment: RequestHandler = async (req, res) => {
  try {
    const { stream_id, content }: CommentRequest = req.body;
    const user_id = req.user?.id;

    if (!user_id || !stream_id || !content) {
      return res.status(400).json({ error: "Invalid request" });
    }

    const { data, error } = await supabase
      .from("comments")
      .insert({ user_id, stream_id, content })
      .select(`
        *,
        users!inner(username)
      `)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ error: "Failed to add comment" });
  }
};

// Delete a comment
export const deleteComment: RequestHandler = async (req, res) => {
  try {
    const commentId = req.params.id;
    const user_id = req.user?.id;

    if (!user_id || !commentId) {
      return res.status(400).json({ error: "Invalid request" });
    }

    const { error } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId)
      .eq("user_id", user_id);

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({ error: "Failed to delete comment" });
  }
};

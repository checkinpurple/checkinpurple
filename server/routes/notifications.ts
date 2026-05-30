import { supabase } from "../supabase";

type NotifType =
  | "booking_request"
  | "booking_accepted"
  | "booking_declined"
  | "new_follower"
  | "coin_tip"
  | "collab_invite"
  | "collab_accepted"
  | "deal_proposal"
  | "deal_accepted"
  | "dressing_offer"
  | "system";

interface CreateNotifParams {
  userId: string;        // recipient
  type: NotifType;
  title: string;
  message: string;
  actionUrl?: string;
}

/**
 * Insert a notification row for a user.
 * Silently swallows errors — notifications are non-critical.
 */
export async function createNotification(params: CreateNotifParams) {
  try {
    await supabase.from("notifications").insert({
      user_id: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      action_url: params.actionUrl || null,
      read: false,
    });
  } catch (err) {
    console.error("createNotification failed (non-fatal):", err);
  }
}

/** Shorthand helpers */
export const notifyBookingRequest = (artistId: string, fanUsername: string) =>
  createNotification({
    userId: artistId,
    type: "booking_request",
    title: "New booking request",
    message: `@${fanUsername} wants to book you`,
    actionUrl: "/bookings",
  });

export const notifyBookingAccepted = (fanId: string, artistUsername: string) =>
  createNotification({
    userId: fanId,
    type: "booking_accepted",
    title: "Booking confirmed!",
    message: `@${artistUsername} accepted your booking request`,
    actionUrl: "/bookings",
  });

export const notifyBookingDeclined = (fanId: string, artistUsername: string) =>
  createNotification({
    userId: fanId,
    type: "booking_declined",
    title: "Booking update",
    message: `@${artistUsername} is unable to take your booking`,
    actionUrl: "/bookings",
  });

export const notifyNewFollower = (artistId: string, followerUsername: string) =>
  createNotification({
    userId: artistId,
    type: "new_follower",
    title: "New follower",
    message: `@${followerUsername} started following you`,
    actionUrl: `/fan/${followerUsername}`,
  });

export const notifyCoinTip = (artistId: string, fromUsername: string, amount: number) =>
  createNotification({
    userId: artistId,
    type: "coin_tip",
    title: `${amount} coins received!`,
    message: `@${fromUsername} tipped you ${amount} coins`,
    actionUrl: "/wallet",
  });

export const notifyCollabInvite = (collaboratorId: string, artistUsername: string) =>
  createNotification({
    userId: collaboratorId,
    type: "collab_invite",
    title: "Collaboration invite",
    message: `@${artistUsername} wants to collaborate with you`,
    actionUrl: `/artist/${artistUsername}`,
  });

export const notifyDealProposal = (influencerId: string, artistUsername: string) =>
  createNotification({
    userId: influencerId,
    type: "deal_proposal",
    title: "New promotion deal",
    message: `@${artistUsername} sent you a promotion deal proposal`,
    actionUrl: "/influencer",
  });

export const notifyDressingOffer = (artistId: string, merchantUsername: string) =>
  createNotification({
    userId: artistId,
    type: "dressing_offer",
    title: "Styling offer received",
    message: `@${merchantUsername} wants to dress you`,
    actionUrl: "/bookings",
  });

import { useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";
import { SOCKET_URL } from "../config.js";

export function useBattleSocket({
  roomCode,
  userId,
  onRoomState,
  onRoomStarted,
  onTimerTick,
  onLeaderboardUpdate,
  onSubmissionResult,
  onRoomEnded,
  onParticipantJoined,
  onRoomError,
}) {
  const socketRef = useRef(null);
  const callbacksRef = useRef({
    onRoomState,
    onRoomStarted,
    onTimerTick,
    onLeaderboardUpdate,
    onSubmissionResult,
    onRoomEnded,
    onParticipantJoined,
    onRoomError,
  });

  callbacksRef.current = {
    onRoomState,
    onRoomStarted,
    onTimerTick,
    onLeaderboardUpdate,
    onSubmissionResult,
    onRoomEnded,
    onParticipantJoined,
    onRoomError,
  };

  useEffect(() => {
    if (!roomCode || !userId) return;

    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
      withCredentials: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join-room", { roomCode, userId });
    });

    socket.on("room-state", (data) => callbacksRef.current.onRoomState?.(data));
    socket.on("room-started", (data) => callbacksRef.current.onRoomStarted?.(data));
    socket.on("timer-tick", (data) => callbacksRef.current.onTimerTick?.(data));
    socket.on("leaderboard-update", (data) =>
      callbacksRef.current.onLeaderboardUpdate?.(data)
    );
    socket.on("submission-result", (data) =>
      callbacksRef.current.onSubmissionResult?.(data)
    );
    socket.on("room-ended", (data) => callbacksRef.current.onRoomEnded?.(data));
    socket.on("participant-joined", (data) =>
      callbacksRef.current.onParticipantJoined?.(data)
    );
    socket.on("room-error", (data) => callbacksRef.current.onRoomError?.(data));

    return () => {
      socket.emit("leave-room", { roomCode, userId });
      socket.disconnect();
    };
  }, [roomCode, userId]);

  const startRoom = useCallback(() => {
    socketRef.current?.emit("start-room", { roomCode, userId });
  }, [roomCode, userId]);

  const requestLeaderboard = useCallback(() => {
    socketRef.current?.emit("request-leaderboard", { roomCode });
  }, [roomCode]);

  return { startRoom, requestLeaderboard, socket: socketRef };
}

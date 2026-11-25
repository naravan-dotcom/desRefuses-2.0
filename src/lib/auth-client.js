"use client";

let currentUser = null;

export function setCurrentUser(user) {
  currentUser = user;
}

export function getCurrentUser() {
  return currentUser;
}

export function getSessionId() {
  return currentUser?.id ?? null;
}

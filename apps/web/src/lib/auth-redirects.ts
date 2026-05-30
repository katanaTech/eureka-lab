/**
 * Role-aware post-auth redirects. Single source of truth for "where does X
 * land after sign-in?" so the welcome page, the standalone /login + /signup
 * pages, the OAuth callback path, and the route-group layouts all agree.
 *
 * The learner side (`role: 'child'`) lands on `/dashboard`; the
 * `(learner)/layout.tsx` then handles the character-gate (bounce to
 * `/character` if no character has been created yet). Adult roles
 * (`parent`, `teacher`) skip the learner layout entirely and land on their
 * own home page.
 */

/** All roles the backend recognises today. */
export type UserRoleString =
  | 'child'
  | 'parent'
  | 'teacher'
  | 'admin'
  | 'super_admin'
  | 'school_admin'
  | string;

/**
 * Home route for a given user role. Used by every post-auth redirect site.
 *
 * @param role - The user's `role` field from the Firestore profile.
 * @returns Absolute path the user should land on after auth.
 */
export function homeForRole(role: UserRoleString): string {
  if (role === 'super_admin') return '/admin';
  if (role === 'school_admin') return '/school';
  if (role === 'parent') return '/parent';
  if (role === 'teacher') return '/teacher';
  if (role === 'admin') return '/parent'; // admins co-mingled with parents for now; no separate /admin
  return '/dashboard'; // child or unknown — learner shell decides next
}

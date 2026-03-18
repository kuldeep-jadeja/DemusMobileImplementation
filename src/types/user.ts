export interface User {
  id: string;
  email: string;
  displayName: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile extends User {
  bio?: string;
  favoriteGenres?: string[];
  followersCount: number;
  followingCount: number;
}

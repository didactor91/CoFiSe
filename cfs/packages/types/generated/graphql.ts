export enum ReservationStatus {
  Pending = 'PENDING',
  Confirmed = 'CONFIRMED',
  Cancelled = 'CANCELLED',
  Completed = 'COMPLETED',
}

export enum UserRole {
  Admin = 'ADMIN',
  Staff = 'STAFF',
}

export type DateTime = string;

export interface News {
  id: string;
  title: string;
  content: string;
  imageUrl?: string | null;
  published: boolean;
  createdAt: DateTime;
  updatedAt: DateTime;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl?: string | null;
  createdAt: DateTime;
  updatedAt: DateTime;
}

export interface Reservation {
  id: string;
  product: Product;
  productId: string;
  quantity: number;
  name: string;
  email: string;
  phone: string;
  notes?: string | null;
  status: ReservationStatus;
  createdAt: DateTime;
  updatedAt: DateTime;
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  createdAt: DateTime;
}

export interface AuthPayload {
  token: string;
  user: User;
}

export interface CreateReservationInput {
  productId: string;
  quantity: number;
  name: string;
  email: string;
  phone: string;
  notes?: string;
}

export interface CreateNewsInput {
  title: string;
  content: string;
  imageUrl?: string;
}

export interface UpdateNewsInput {
  title?: string;
  content?: string;
  imageUrl?: string;
}

export interface CreateUserInput {
  email: string;
  password: string;
  role: UserRole;
}

export interface CreateReservationMutationResult {
  createReservation: Reservation;
}

export interface LoginMutationResult {
  login: AuthPayload;
}

export interface CreateNewsMutationResult {
  createNews: News;
}

export interface UpdateNewsMutationResult {
  updateNews: News;
}

export interface DeleteNewsMutationResult {
  deleteNews: boolean;
}

export interface PublishNewsMutationResult {
  publishNews: News;
}

export interface UnpublishNewsMutationResult {
  unpublishNews: News;
}

export interface UpdateReservationStatusMutationResult {
  updateReservationStatus: Reservation;
}

export interface CreateUserMutationResult {
  createUser: User;
}

export interface DeleteUserMutationResult {
  deleteUser: boolean;
}

export interface NewsQueryResult {
  news: News[];
}

export interface NewsItemQueryResult {
  newsItem: News | null;
}

export interface ProductsQueryResult {
  products: Product[];
}

export interface ProductQueryResult {
  product: Product | null;
}

export interface MeQueryResult {
  me: User | null;
}

export interface AllNewsQueryResult {
  allNews: News[];
}

export interface ReservationsQueryResult {
  reservations: Reservation[];
}

export interface ReservationQueryResult {
  reservation: Reservation | null;
}

export interface UsersQueryResult {
  users: User[];
}

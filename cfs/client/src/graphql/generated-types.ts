export enum ReservationStatus {
  PendingUnverified = 'PENDING_UNVERIFIED',
  Pending = 'PENDING',
  Confirmed = 'CONFIRMED',
  Cancelled = 'CANCELLED',
  Completed = 'COMPLETED',
}

export enum UserRole {
  Admin = 'ADMIN',
  Staff = 'STAFF',
}

export enum OptionType {
  Size = 'SIZE',
  Color = 'COLOR',
}

export type DateTime = string;

export interface News {
  id: string;
  title: string;
  content: string;
  imageUrl?: string | null;
  createdAt: DateTime;
  updatedAt: DateTime;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number | null;
  limitedStock: boolean;
  imageUrl?: string | null;
  createdAt: DateTime;
  updatedAt: DateTime;
  options: ProductOption[];
}

export interface ProductOption {
  id: string;
  productId: string;
  name: string;
  type: OptionType;
  required: boolean;
  values: OptionValue[];
}

export interface OptionValue {
  id: string;
  optionId: string;
  value: string;
  stock?: number | null;
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
  items: ReservationItem[];
  createdAt: DateTime;
  updatedAt: DateTime;
}

export interface ReservationItem {
  id: string;
  reservationId: string;
  productId: string;
  productName: string;
  optionValueId?: string | null;
  optionValue?: string | null;
  quantity: number;
  unitPrice: number;
}

export interface ReservationProductTotal {
  productId: string;
  productName: string;
  quantity: number;
}

export interface ReservationSizeTotal {
  size: string;
  quantity: number;
}

export interface ReservationMetrics {
  totalReservations: number;
  totalUnits: number;
  byProduct: ReservationProductTotal[];
  bySize: ReservationSizeTotal[];
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  createdAt: DateTime;
}

export interface Event {
  id: string;
  name: string;
  description?: string | null;
  location: string;
  startTime: DateTime;
  endTime: DateTime;
  createdAt: DateTime;
  updatedAt: DateTime;
}

export interface AuthPayload {
  token: string;
  refreshToken: string;
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

export interface CreateProductInput {
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl?: string;
}

export interface UpdateProductInput {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  imageUrl?: string;
}

export interface CreateUserInput {
  email: string;
  password: string;
  role: UserRole;
}

export interface CreateEventInput {
  name: string;
  description?: string;
  location: string;
  startTime: DateTime;
  endTime: DateTime;
}

export interface UpdateEventInput {
  name?: string;
  description?: string;
  location?: string;
  startTime?: DateTime;
  endTime?: DateTime;
}

export interface CreateReservationMutationResult {
  createReservation: Reservation;
}

export interface LoginMutationResult {
  login: AuthPayload;
}

export interface RefreshTokenMutationResult {
  refreshToken: AuthPayload;
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

export interface CreateProductMutationResult {
  createProduct: Product;
}

export interface UpdateProductMutationResult {
  updateProduct: Product;
}

export interface DeleteProductMutationResult {
  deleteProduct: boolean;
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

export interface ReservationMetricsQueryResult {
  reservationMetrics: ReservationMetrics;
}

export interface UsersQueryResult {
  users: User[];
}

export interface EventsQueryResult {
  events: Event[];
}

export interface EventQueryResult {
  event: Event | null;
}

export interface AllEventsQueryResult {
  allEvents: Event[];
}

export interface ProductOptionsQueryResult {
  productOptions: ProductOption[];
}

export interface CreateProductOptionInput {
  productId: string;
  name: string;
  type: OptionType;
  required: boolean;
}

export interface UpdateProductOptionInput {
  name?: string;
  type?: OptionType;
  required?: boolean;
}

export interface OptionValueInput {
  value: string;
  stock?: number | null;
}

export interface CreateProductOptionMutationResult {
  createProductOption: ProductOption;
}

export interface UpdateProductOptionMutationResult {
  updateProductOption: ProductOption;
}

export interface DeleteProductOptionMutationResult {
  deleteProductOption: boolean;
}

export interface AddOptionValuesMutationResult {
  addOptionValues: ProductOption;
}

export interface UpdateOptionValueMutationResult {
  updateOptionValue: OptionValue;
}

export interface DeleteOptionValueMutationResult {
  deleteOptionValue: boolean;
}

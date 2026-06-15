export type UserRole = "BUYER" | "ADMIN" | "STAFF";

export interface User {
  id:                  string;
  email:               string;
  phone:               string | null;
  full_name:           string;
  virtual_number:      string | null;
  virtual_name:        string;
  virtual_photo:       string | null;
  station_code:        string;
  role:                UserRole;
  auth_provider:       string;
  is_verified:         boolean;
  is_phone_verified:   boolean;
  onboarding_complete: boolean;
  village:             string;
  district:            string;
  state:               string;
}

export interface Shop {
  id:             string;
  name:           string;
  slug:           string;
  description:    string;
  category:       { id: string; name: string } | null;
  logo:           string | null;
  banner:         string | null;
  address:        string;
  village:        string;
  district:       string;
  is_open:        boolean;
  is_approved:    boolean;
  average_rating: number;
  total_reviews:  number;
  distance_km?:   number;
}

export interface Product {
  id:               string;
  name:             string;
  slug:             string;
  description:      string;
  price:            string;
  discounted_price: string;
  discount_percent: number;
  stock:            number;
  is_in_stock:      boolean;
  unit:             string;
  primary_image:    string | null;
  shop_name:        string;
  shop_slug:        string;
  category_name:    string;
  average_rating:   number;
}

export interface CartItem {
  id:            string;
  product:       string;
  product_name:  string;
  product_image: string | null;
  quantity:      number;
  unit_price:    string;
  line_total:    string;
}

export interface Cart {
  id:              string;
  shop:            string | null;
  shop_name:       string | null;
  items:           CartItem[];
  total_items:     number;
  subtotal:        string;
  delivery_charge: string;
  total_amount:    string;
}

export interface Order {
  id:               string;
  order_number:     string;
  shop_name:        string;
  status:           string;
  payment_method:   string;
  payment_status:   string;
  total_amount:     string;
  total_items:      number;
  delivery_address: string;
  created_at:       string;
  items?:           any[];
}
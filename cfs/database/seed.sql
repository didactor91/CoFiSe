-- CFS Landing Seed Data
-- Initial data for development and testing

-- Enable foreign keys
PRAGMA foreign_keys = ON;

-- Begin transaction for idempotent seed
BEGIN TRANSACTION;

-- Clear existing data (idempotent)
DELETE FROM reservation_items;
DELETE FROM verification_codes;
DELETE FROM cart_items;
DELETE FROM carts;
DELETE FROM option_values;
DELETE FROM product_options;
DELETE FROM events;
DELETE FROM reservations;
DELETE FROM news;
DELETE FROM products;
DELETE FROM users;

-- Seed Admin User
-- Password: changeme123 (bcrypt hash)
INSERT INTO users (email, password, role) VALUES (
    'admin@senacom.com',
    '$2b$12$LSHxL6kLObvBGTpma7IXMOQe.Pe/pNfxZW0/4OEWTqHeuI62j8CTe',
    'admin'
);

-- Seed Staff User
-- Password: changeme123 (same bcrypt hash)
INSERT INTO users (email, password, role) VALUES (
    'staff@senacom.com',
    '$2b$12$LSHxL6kLObvBGTpma7IXMOQe.Pe/pNfxZW0/4OEWTqHeuI62j8CTe',
    'staff'
);

-- Seed Sample Products (6 items for catalog preview)
INSERT INTO products (name, description, price, stock, image_url) VALUES
    ('Paella Valenciana', 'Traditional paella with saffron rice, chicken, rabbit, and green beans', 45.00, 20, '/images/products/paella.jpg'),
    ('Arroz al Horno', 'Baked rice dish with pork ribs, botifarra sausage, and chickpeas', 38.00, 15, '/images/products/arroz-horno.jpg'),
    ('Gazpacho Manchego', 'Regional meat stew with game, vegetables, and bread', 32.00, 12, '/images/products/gazpacho.jpg'),
    ('Michelada Especial', 'Spicy beer cocktail with lime, salt, and chili', 8.50, 50, '/images/products/michelada.jpg'),
    ('Flan Casero', 'Traditional homemade custard with caramel sauce', 6.00, 30, '/images/products/flan.jpg'),
    ('Agua de Valencia', 'Refreshing orange juice with cava and vodka', 12.00, 40, '/images/products/agua-valencia.jpg');

-- Seed Sample News (3 items)
INSERT INTO news (title, content, image_url) VALUES
    ('¡Vuelve la Fiesta de Seno!', 'Nos complace anunciar que este año recuperamos nuestras fiestas patronales con un programa lleno de actividades para todas las edades. Habrá música, gastronomía tradicional y actividades infantiles.', '/images/news/fiesta2026.jpg'),
    ('Nuevo Horario de la Barra', 'A partir de este fin de semana, la barra del local permanecerá abierta de 18:00 a 02:00 todos los viernes y sábados. ¡Os esperamos!', '/images/news/barra-horario.jpg'),
    ('Reserva tu Mesa', 'Ya puedes reservar mesas para grupos grandes. Contacta con nosotros a través del formulario de reservas o llama al teléfono del local. Sugerencias y grupos de más de 10 personas con reserva anticipada.', '/images/news/reserva-mesa.jpg');

-- Seed Sample Events (3 items)
INSERT INTO events (name, description, location, start_time, end_time) VALUES
    ('Festa Major 2026', 'Celebración de las fiestas patronales de Seno con música, verbena y gastronomía tradicional', 'Plaza Mayor de Seno', '2026-08-15 18:00:00', '2026-08-15 23:00:00'),
    ('Concierto de庭', 'Concierto de庭 en el marco de las fiestas de verano', 'Auditorio Municipal', '2026-07-20 21:00:00', '2026-07-20 23:30:00'),
    ('Taller de Cocina', 'Aprende a cocinar paella auténtica con nuestros chefs', 'Bar del Local', '2026-06-10 11:00:00', '2026-06-10 14:00:00');

COMMIT;
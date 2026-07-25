USE rfid_attendance;

INSERT INTO students (nis, name, class) VALUES
('2024001', 'Bagas Pratama',   'XII RPL 5'),
('2024002', 'Siti Aminah',     'XII RPL 5'),
('2024003', 'Andi Saputra',    'XI TKJ 2'),
('2024004', 'Dewi Lestari',    'XI TKJ 2'),
('2024005', 'Rizky Ramadhan',  'XII RPL 5'),
('2024006', 'Putri Handayani', 'XII RPL 5'),
('2024007', 'Fajar Nugroho',   'XI TKJ 2'),
('2024008', 'Nabila Zahra',    'XII RPL 5');

INSERT INTO cards (uid, student_id) VALUES
('0412A3B5C2D1', 1),
('04F8C2A1B3E9', 2),
('04A1D7F3C8B2', 3),
('04B9E2C7D1A6', 4),
('04C3F1A8B5D0', 5),
('04D7B6C9E2F4', 6),
('04E5A0D3F7C1', 7),
('04F2C8B1A6E3', 8);
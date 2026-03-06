-- SQL Script để tạo các bảng cho Cosy Game Zone
-- Chạy script này trong SQL Server Management Studio (SSMS)

-- 1. Tạo bảng USERS
CREATE TABLE dbo.users (
    id INT PRIMARY KEY IDENTITY(1,1),
    username NVARCHAR(100) NOT NULL UNIQUE,
    email NVARCHAR(255) NOT NULL UNIQUE,
    password NVARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT GETUTCDATE()
);

-- 2. Tạo bảng GAMES
CREATE TABLE dbo.games (
    id INT PRIMARY KEY IDENTITY(1,1),
    title NVARCHAR(255) NOT NULL,
    category NVARCHAR(50),
    rating FLOAT,
    players INT,
    image NVARCHAR(MAX),
    created_at DATETIME DEFAULT GETUTCDATE()
);

-- 3. Tạo bảng LEADERBOARD
CREATE TABLE dbo.leaderboard (
    id INT PRIMARY KEY IDENTITY(1,1),
    name NVARCHAR(100) NOT NULL,
    score INT NOT NULL,
    game_id INT,
    user_id INT,
    created_at DATETIME DEFAULT GETUTCDATE()
);

-- 4. Tạo bảng FRIENDS
CREATE TABLE dbo.friends (
    id INT PRIMARY KEY IDENTITY(1,1),
    user_id INT NOT NULL,
    name NVARCHAR(100) NOT NULL,
    avatar NVARCHAR(MAX),
    status NVARCHAR(20) DEFAULT 'offline',
    created_at DATETIME DEFAULT GETUTCDATE()
);

-- (Optional) Thêm dữ liệu mẫu vào GAMES
INSERT INTO dbo.games (title, category, rating, players, image) VALUES
('Cyber Racers 2077', 'Đua xe', 4.8, 12500, 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=600&q=80'),
('Space Warriors', 'Bắn súng', 4.5, 8900, 'https://images.unsplash.com/photo-1553090774-87b8b5b35abc?w=600&q=80'),
('Chess Master', 'Chiến thuật', 4.9, 5600, 'https://images.unsplash.com/photo-1570303295463-20effa5a19cd?w=600&q=80'),
('Card Kingdom', 'Thẻ bài', 4.6, 9200, 'https://images.unsplash.com/photo-1581904349508-6e5e4abb8a75?w=600&q=80'),
('Puzzle Paradise', 'Xếp hình', 4.7, 15300, 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=600&q=80');

-- Kiểm tra bảng đã tạo thành công
SELECT 'USERS' as TableName, COUNT(*) as RowCount FROM dbo.users
UNION ALL
SELECT 'GAMES', COUNT(*) FROM dbo.games
UNION ALL
SELECT 'LEADERBOARD', COUNT(*) FROM dbo.leaderboard
UNION ALL
SELECT 'FRIENDS', COUNT(*) FROM dbo.friends;

-- Xem cấu trúc các bảng
EXEC sp_columns @table_name = 'users';
EXEC sp_columns @table_name = 'games';
EXEC sp_columns @table_name = 'leaderboard';
EXEC sp_columns @table_name = 'friends';

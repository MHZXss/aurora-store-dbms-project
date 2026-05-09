/* 
 AURORA Artisan Library - Transact-SQL (SQL Server / SSMS)
 DBMS Final Project Script
*/

-- 1. Tables Definition
CREATE TABLE Users (
    UserID INT PRIMARY KEY IDENTITY(1,1),
    FullName NVARCHAR(100) NOT NULL,
    UniversityID NVARCHAR(20) UNIQUE NOT NULL,
    Email NVARCHAR(100) UNIQUE NOT NULL,
    PasswordHash NVARCHAR(255) NOT NULL
);

CREATE TABLE Tools (
    ToolID INT PRIMARY KEY IDENTITY(1,1),
    Name NVARCHAR(100) NOT NULL,
    Category NVARCHAR(50) CHECK (Category IN ('Jewelry', '3D Print', 'CNC', 'Laser', 'Woodworking')),
    DailyRate DECIMAL(10, 2) NOT NULL,
    BuyPrice DECIMAL(10, 2) NOT NULL,
    Deposit DECIMAL(10, 2) NOT NULL,
    Status NVARCHAR(20) DEFAULT 'Available' CHECK (Status IN ('Available', 'Rented', 'Maintenance')),
    ImageURL NVARCHAR(MAX)
);

CREATE TABLE Rentals (
    RentalID INT PRIMARY KEY IDENTITY(1,1),
    ToolID INT NOT NULL,
    UserID INT NOT NULL,
    StartDate DATE NOT NULL,
    EndDate DATE NOT NULL,
    TotalFee DECIMAL(10, 2) NOT NULL,
    RentalStatus NVARCHAR(20) DEFAULT 'Active' CHECK (RentalStatus IN ('Active', 'Completed', 'Overdue')),
    CONSTRAINT FK_Rentals_Tools FOREIGN KEY (ToolID) REFERENCES Tools(ToolID),
    CONSTRAINT FK_Rentals_Users FOREIGN KEY (UserID) REFERENCES Users(UserID),
    CONSTRAINT CHK_DateOrder CHECK (EndDate >= StartDate)
);

GO

-- 2. Stored Procedures
-- SP: Check availability for a specific tool and date range
CREATE PROCEDURE sp_CheckToolAvailability
    @ToolID INT,
    @StartDate DATE,
    @EndDate DATE
AS
BEGIN
    IF EXISTS (
        SELECT 1 FROM Rentals 
        WHERE ToolID = @ToolID 
        AND RentalStatus = 'Active'
        AND (@StartDate BETWEEN StartDate AND EndDate OR @EndDate BETWEEN StartDate AND EndDate)
    )
        SELECT 0 AS IsAvailable;
    ELSE
        SELECT 1 AS IsAvailable;
END;
GO

-- SP: Process a new rental
CREATE PROCEDURE sp_ProcessRental
    @UserID INT,
    @ToolID INT,
    @Days INT
AS
BEGIN
    DECLARE @DailyRate DECIMAL(10,2), @Deposit DECIMAL(10,2);
    SELECT @DailyRate = DailyRate, @Deposit = Deposit FROM Tools WHERE ToolID = @ToolID;

    DECLARE @TotalFee DECIMAL(10,2) = (@DailyRate * @Days) + @Deposit;
    DECLARE @StartDate DATE = GETDATE();
    DECLARE @EndDate DATE = DATEADD(DAY, @Days, @StartDate);

    INSERT INTO Rentals (ToolID, UserID, StartDate, EndDate, TotalFee, RentalStatus)
    VALUES (@ToolID, @UserID, @StartDate, @EndDate, @TotalFee, 'Active');

    UPDATE Tools SET Status = 'Rented' WHERE ToolID = @ToolID;
END;
GO

-- 3. Trigger
-- Automatically restore tool status when a rental is completed
CREATE TRIGGER tr_UpdateToolOnReturn
ON Rentals
AFTER UPDATE
AS
BEGIN
    IF UPDATE(RentalStatus)
    BEGIN
        UPDATE T
        SET T.Status = 'Available'
        FROM Tools T
        INNER JOIN inserted I ON T.ToolID = I.ToolID
        WHERE I.RentalStatus = 'Completed';
    END
END;
GO

-- 4. Seed Data
INSERT INTO Tools (Name, Category, DailyRate, BuyPrice, Deposit, Status, ImageURL) VALUES
('Formlabs Form 3B+', '3D Print', 45.00, 3500.00, 200.00, 'Available', 'https://images.unsplash.com/photo-1631281434193-96b65f492b4a?auto=format&fit=crop&q=80&w=400'),
('Desktop CNC Nomad 3', 'CNC', 60.00, 2800.00, 300.00, 'Available', 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=400'),
('Glowforge Pro Laser', 'Laser', 80.00, 6000.00, 500.00, 'Available', 'https://images.unsplash.com/photo-1590494165264-1ebe3602eb80?auto=format&fit=crop&q=80&w=400'),
('Durston Rolling Mill', 'Jewelry', 25.00, 1200.00, 150.00, 'Available', 'https://images.unsplash.com/photo-1551061952-ec0691e8460f?auto=format&fit=crop&q=80&w=400'),
('Pepe Tools Bench Mandrel', 'Jewelry', 15.00, 450.00, 100.00, 'Available', 'https://images.unsplash.com/photo-1617043786394-f977fa12eddf?auto=format&fit=crop&q=80&w=400'),
('Bambu Lab X1-Carbon', '3D Print', 35.00, 1500.00, 150.00, 'Available', 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&q=80&w=400'),
('Wacom Cintiq Pro 27', '3D Print', 100.00, 3500.00, 400.00, 'Available', 'https://images.unsplash.com/photo-1542744095-2ad484879684?auto=format&fit=crop&q=80&w=400'),
('Mitre Saw Kapex KS 120', 'Woodworking', 50.00, 1600.00, 200.00, 'Available', 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&q=80&w=400'),
('Sinterit Lisa Pro SLM', '3D Print', 150.00, 12000.00, 1000.00, 'Available', 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&q=80&w=400'),
('Desktop Lathe 210V', 'CNC', 40.00, 1100.00, 200.00, 'Available', 'https://images.unsplash.com/photo-1581092334651-ddf26d9a1930?auto=format&fit=crop&q=80&w=400');

INSERT INTO Users (FullName, UniversityID, Email, PasswordHash) VALUES
('M. Hammad', 'U123456', 'mhammadzub@gmail.com', 'hashed_pass_123');

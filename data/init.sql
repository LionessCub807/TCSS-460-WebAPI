-- Active: 1710457548247@@127.0.0.1@5432@tcss460@public
DROP TABLE IF EXISTS Demo;
CREATE TABLE Demo (DemoID SERIAL PRIMARY KEY,
                        Priority INT,
                        Name TEXT NOT NULL UNIQUE,
                        Message TEXT
);
DROP TABLE IF EXISTS Account;
CREATE TABLE Account (Account_ID SERIAL PRIMARY KEY,
                      FirstName VARCHAR(255) NOT NULL,
		              LastName VARCHAR(255) NOT NULL,
                      Username VARCHAR(255) NOT NULL UNIQUE,
                      Email VARCHAR(255) NOT NULL UNIQUE,
                      Phone VARCHAR(15) NOT NULL UNIQUE,
                      Account_Role int NOT NULL
);

DROP TABLE IF EXISTS Account_Credential;
CREATE TABLE Account_Credential (Credential_ID SERIAL PRIMARY KEY,
                      Account_ID INT NOT NULL,
                      Salted_Hash VARCHAR(255) NOT NULL,
                      salt VARCHAR(255),
                      FOREIGN KEY(Account_ID) REFERENCES Account(Account_ID)
);
DROP TABLE IF EXISTS tempbook;
-- Temporary table
-- Only used to move data from CSV file to SQL tables
CREATE TEMP TABLE tempbook (book_id INT,
    isbn13 BIGINT,
    authors TEXT,
    original_publication_year INT,
    original_title TEXT,
    title TEXT,
    average_rating FLOAT,
    ratings_count INT,
    ratings_1 INT,
    ratings_2 INT,
    ratings_3 INT,
    ratings_4 INT,
    ratings_5 INT,
    image_url TEXT,
    small_image_url TEXT
);

-- Populating temporary table
COPY tempbook
FROM '/docker-entrypoint-initdb.d/books.csv'
DELIMITER ','
CSV HEADER;

DROP TABLE IF EXISTS Books;
-- Book table
CREATE TABLE Books (bookid SERIAL PRIMARY KEY,
        isbn13 BIGINT UNIQUE,
        publication_year INT,
        original_title TEXT,
        title TEXT,
        image_url TEXT,
        image_small_url TEXT
    );

-- Inserts all information about books
INSERT INTO Books (isbn13, publication_year, original_title, title, image_url, image_small_url) 
SELECT isbn13, original_publication_year, original_title, title, image_url, small_image_url
FROM tempbook;

DROP TABLE IF EXISTS Authors;
-- Author table
CREATE TABLE Authors(authorid SERIAL PRIMARY KEY,
        authorname TEXT
);

-- Inserts all authors names
INSERT INTO Authors (authorname) 

-- Selecting all authors that are comma sepreated
-- Turns to array => turns each index of array into a value
SELECT DISTINCT TRIM(unnest(string_to_array(authors, ','))) 
AS authors 
FROM tempbook 

UNION 

-- Selecting all authors that are not comma sepreated
SELECT DISTINCT authors 
AS author
FROM tempbook 
WHERE authors 
NOT LIKE '%,%';

DROP TABLE IF EXISTS BookAuthor;
-- Book and author transaction table
CREATE TABLE BookAuthor (authorid INT,
        bookid INT,
        FOREIGN KEY (authorid) REFERENCES Authors(authorid),
        FOREIGN KEY (bookid) REFERENCES Books(bookid) ON DELETE CASCADE
);

-- Populating transaction table
-- Joining author on temp based on author name
INSERT INTO BookAuthor (authorid, bookid) 
SELECT a.authorid, t.book_id 
FROM authors a 
JOIN tempbook t 
ON t.authors 
LIKE '%' || a.authorname || '%';

DROP TABLE IF EXISTS Ratings;
-- Ratings Table
CREATE TABLE Ratings(ratingid SERIAL PRIMARY KEY,
        bookid INT,
        rating_1_star INT,
        rating_2_star INT,
        rating_3_star INT,
        rating_4_star INT,
        rating_5_star INT,
        FOREIGN KEY (bookid) REFERENCES Books(bookid) ON DELETE CASCADE
);

-- Populating ratings table
INSERT INTO Ratings (bookid, rating_1_star, rating_2_star, rating_3_star, rating_4_star, rating_5_star) 
SELECT book_id, ratings_1, ratings_2, ratings_3, ratings_4, ratings_5
FROM tempbook;
-- Active: 1710457548247@@127.0.0.1@5432@tcss460@public
DROP TABLE IF EXISTS Demo;
CREATE TABLE Demo (DemoID SERIAL PRIMARY KEY,
                        Priority INT,
                        Name TEXT NOT NULL UNIQUE,
                        Message TEXT
);

DROP TABLE IF EXISTS Account CASCADE;
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


DROP TABLE IF EXISTS BOOKS;
--CREATE TABLE BOOKS (id INT PRIMARY KEY,
        --isbn13 BIGINT,
        --authors TEXT,
        --publication_year INT,
        --original_title TEXT,
        --title TEXT,
        --rating_avg FLOAT,
        --rating_count INT,
        --rating_1_star INT,
        --rating_2_star INT,
        --rating_3_star INT,
        --rating_4_star INT,
        --rating_5_star INT,
        --image_url TEXT,
        --image_small_url TEXT
    --);

    -- Temporary table
-- Only used to move data from CSV file to SQL tables
DROP TABLE IF EXISTS tempbook CASCADE;
CREATE TABLE tempbook (book_id INT,
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

-- Book table
DROP TABLE IF EXISTS Books CASCADE;
CREATE TABLE Books (bookid SERIAL PRIMARY KEY,
        isbn13 BIGINT UNIQUE,
        publication_year INT,
        original_title TEXT,
        title TEXT,
        image_url TEXT,
        image_small_url TEXT
    );

-- Author table
DROP TABLE IF EXISTS Authors CASCADE;
CREATE TABLE Authors(authorid SERIAL PRIMARY KEY,
        authorname TEXT
);

-- Book and author transaction table
DROP TABLE IF EXISTS BookAuthor CASCADE;
CREATE TABLE BookAuthor (authorid INT,
        bookid INT,
        FOREIGN KEY (authorid) REFERENCES Authors(authorid),
        FOREIGN KEY (bookid) REFERENCES Books(bookid)
);

-- Ratings Table
DROP TABLE IF EXISTS Ratings CASCADE;
CREATE TABLE Ratings(ratingid SERIAL PRIMARY KEY,
        bookid INT,
        rating_1_star INT,
        rating_2_star INT,
        rating_3_star INT,
        rating_4_star INT,
        rating_5_star INT,
        FOREIGN KEY (bookid) REFERENCES Books(bookid)
);
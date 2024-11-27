-- This SQL script builds a Centsible database, deleting any pre-existing version.

-- @author Alina Sainju

DROP TABLE IF EXISTS AppUser;
DROP TABLE IF EXISTS BudgetCategory;
DROP TABLE IF EXISTS BudgetSubCategory;
DROP TABLE IF EXISTS TransactionEntry;

CREATE TABLE AppUser (
    ID SERIAL PRIMARY KEY,
    firstname VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    passwordhash VARCHAR(255) NOT NULL,
    joindate DATE NOT NULL DEFAULT CURRENT_DATE,
    currentbalance DECIMAL(15, 2) NOT NULL DEFAULT 0.00
);

CREATE TABLE BudgetCategory (
    ID SERIAL PRIMARY KEY,
    appuserID INT NOT NULL REFERENCES AppUser(ID) ON DELETE CASCADE,
    categoryname VARCHAR(100) NOT NULL,
    monthlydollaramount DECIMAL(15, 2) NOT NULL CHECK (monthlydollaramount >= 0),
    month SMALLINT NOT NULL CHECK (month BETWEEN 1 AND 12),
    year SMALLINT NOT NULL CHECK (year >= 2000)
);

CREATE TABLE BudgetSubcategory (
    ID SERIAL PRIMARY KEY,
    budgetcategoryID INT NOT NULL REFERENCES BudgetCategory(ID) ON DELETE CASCADE,
    subcategoryname VARCHAR(100) NOT NULL,
    monthlydollaramount DECIMAL(15, 2) NOT NULL CHECK (monthlydollaramount >= 0)
);

CREATE TABLE TransactionEntry (
    ID SERIAL PRIMARY KEY,
    appuserID INT NOT NULL REFERENCES AppUser(ID) ON DELETE CASCADE,
    dollaramount DECIMAL(15, 2) NOT NULL CHECK (dollaramount != 0),
    transactiontype VARCHAR(50) NOT NULL CHECK (transactiontype IN ('Income', 'Expense')),
    budgetcategoryID INT REFERENCES BudgetCategory(ID) ON DELETE SET NULL,
    optionaldescription TEXT,
    transactiondate DATE NOT NULL DEFAULT CURRENT_DATE
);


GRANT SELECT ON AppUser TO PUBLIC;
GRANT SELECT ON BudgetCategory TO PUBLIC;
GRANT SELECT ON BudgetSubCategory TO PUBLIC;
GRANT SELECT ON TransactionEntry TO PUBLIC;









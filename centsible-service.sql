-- This SQL script builds a Centsible database, deleting any pre-existing version.

-- @author Alina Sainju

DROP TABLE IF EXISTS transaction_entry;
DROP TABLE IF EXISTS user;
DROP TABLE IF EXISTS category_budget;

CREATE TABLE user (
    ID SERIAL PRIMARY KEY,
    first_name varchar(50),
    email varchar(50) NOT NULL,
    password_hash varchar(50) NOT NULL,
    join_date date
);

CREATE TABLE category_budget (
    ID SERIAL PRIMARY KEY,
    user_ID integer REFERENCES user(ID),
    category_name varchar(50),
    monthly_dollar_amount numeric,
    starting_date date,
    ending_date date
);

CREATE TABLE transaction_entry (
    ID SERIAL PRIMARY KEY,
    user_ID integer REFERENCES user(ID),
    dollar_amount numeric,
    transactionType varchar(50),
    category_budget_ID integer REFERENCES category_budget(ID),
    date_of_transaction date
);


GRANT SELECT ON transaction_entry TO PUBLIC;
GRANT SELECT ON user TO PUBLIC;
GRANT SELECT ON category_budget TO PUBLIC;

INSERT INTO user(first_name, email, password_hash, join_date) VALUES ('Jack', 'jack345@gmail.com', 'puppyknight', '2024-11-01');
INSERT INTO user(first_name, email, password_hash, join_date) VALUES ('Krista', 'cristi_@gmail.com', 'olmpw', '2024-11-03');

INSERT INTO category_budget(user_ID, category_name, monthly_dollar_amount, starting_date, ending_date) VALUES (1, 'Groceries', 100, '2024-11-01', '2024-11-30');
INSERT INTO category_budget(user_ID, category_name, monthly_dollar_amount, starting_date, ending_date) VALUES (2, 'Travel', 70, '2024-11-01', '2024-11-30');
INSERT INTO category_budget(user_ID, category_name, monthly_dollar_amount, starting_date, ending_date) VALUES (1, 'Shopping', 240, '2024-11-01', '2024-11-30');

INSERT INTO transaction_entry(user_ID, dollar_amount, transactionType, category_budget_ID, date_of_transaction) VALUES (1, 57.99, 'Expense', 3,'2024-11-06');
INSERT INTO transaction_entry(user_ID, dollar_amount, transactionType, category_budget_ID, date_of_transaction) VALUES (1, 25, 'Expense', 1,'2024-11-06');
INSERT INTO transaction_entry(user_ID, dollar_amount, transactionType, category_budget_ID, date_of_transaction) VALUES (2, 25, 'Expense', 2,'2024-11-07');






-- This SQL script implements sample queries on the Centsible database.

-- @author Alina Sainju


-- Get all the user accounts' details
SELECT * FROM user_account;

-- Get all the transactions associated with user 'Jack'
SELECT
  user_account.first_name,
  transaction_entry.dollar_amount,
  transaction_entry.transactionType,
  category_budget.category_name,
  transaction_entry.date_of_transaction
FROM
  user_account
JOIN
  transaction_entry ON user_account.ID = transaction_entry.user_account_ID
JOIN
  category_budget ON transaction_entry.category_budget_ID = category_budget.ID
WHERE
  user_account.first_name = 'Jack';


-- Get all budgets associated with user 'Krista'
SELECT
  user_account.first_name,
  category_budget.category_name,
  category_budget.monthly_dollar_amount,
  category_budget.starting_date,
  category_budget.ending_date
FROM
  user_account
JOIN
  category_budget ON user_account.ID = category_budget.user_account_ID
WHERE
  user_account.first_name = 'Krista';


-- Compare budget amount and expense transactions for user 'Jack' and budget category 'Groceries'
-- SELECT
--   user_account.first_name,
--   transaction_entry.dollar_amount,
--   category_budget.monthly_dollar_amount
-- FROM
--   user_account
-- JOIN
--   transaction_entry ON user_account.ID = transaction_entry.user_account_ID
-- JOIN
--   category_budget ON transaction_entry.category_budget_ID = category_budget.ID
-- WHERE (user_account.first_name = 'Jack' AND category_budget.category_name = 'Groceries');




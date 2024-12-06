# Service

This is the data service application for our [CS 262 budget app project.](https://github.com/calvin-cs262-Fall2024-TheATeam/Project), which is deployed here:

- [https://centsible-gahyafbxhwd7atgy.eastus2-01.azurewebsites.net/](https://centsible-gahyafbxhwd7atgy.eastus2-01.azurewebsites.net/)

It has the following read data route URLs:

- / a hello message
- /transactions/:id all transactions of user id
- /currentBalance/:id the current balance of user id
- /budgetCategoryName/:id the category name of budget category id
- /monthBudget budget information of a user for a particular month
- /budgetSubcategory/:id all subcategories for a budget category id

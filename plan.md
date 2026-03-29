## plan to implement new features

- A page for the cart, the user should be able to see the items in the cart and the total price, the user should be able to remove items from the cart and the total price should be updated and displayed.
- The button "Agregar" should be enabled and you should add a dropdown right before the button to select the presentation (size) of the item, this select dropdown should be styled as a select, use shadcn/ui components for the select. Options are always going to be "1/2 litro" and "1 litro".
- Remove "Pedido proximamente" button
- The user should see on the navigation navbar a cart icon button with the number of items in small formatted text in the cart, this button should be styled as a button, use shadcn/ui components for the button.

### API
You have to build a CRUD API for the flavors, you should use the following endpoints:
- GET /flavors: to get all the flavors
- GET /flavors/:id: to get a flavor by id
- POST /flavors: to create a new flavor
- PUT /flavors/:id: to update a flavor by id
- DELETE /flavors/:id: to delete a flavor by id

You have to build a CRUD API for the orders, you should use the following endpoints:
- GET /orders: to get all the orders
- GET /orders/:id: to get an order by id
- POST /orders: to create a new order
- PUT /orders/:id: to update an order by id
- DELETE /orders/:id: to delete an order by id

### Database
You should use a MongoDB database, you should use the following collections:
- flavors: to store the flavors
- orders: to store the orders
- order_items: to store the items in the order

Use current ui design from the cards for the flavors model.
Use standard mongoose model for the database.
Use standard order schema for the orders model.
Use standard order item schema for the order items model.

### Email notifications
You should use Resend and react-email to send emails for the notifications.

There's two types of notifications:
- Order pending confirmation: when the order is pending confirmation, you should send an email to the user with the order details.
  This email should have a bank account payment details and instructions to pay for the order.
- Order confirmed: when the order is confirmed, you should send an email to the user with the order details.

Make sure the email's layout goes according to the current ui design.

### Environment variables
For anything that requires a secret, you should use the environment variables.
Update the .env.example file with the new environment variables.
Some examples, mongoose database url, resend api key, etc.
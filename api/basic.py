from flask import (Flask, render_template, request, redirect, 
                   url_for, session)
from flask_pymongo import PyMongo
from functools import wraps
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

if os.getenv("VERCEL_ENV"):  
    app.config['SECRET_KEY'] = os.getenv("SECRET_KEY", "fallback-secret-key")
    app.config["MONGO_URI"] = os.getenv("MONGO_URI") 
else:  # Local python api/basic.py
    app.config['SECRET_KEY']  = "mysecretkey"
    app.config["MONGO_URI"] = "mongodb://localhost:27017/shopping_db"   

mongo = PyMongo(app)
db = mongo.db

if os.getenv("VERCEL_ENV"):  # on vercel 
    from .models.zakupy import *
    from .models.product import Produkt
else:  # Local
    from models.zakupy import *
    from models.product import Produkt


# Decorators USER AUTHENTICATION
def login_required(func):
    @wraps(func)
    def wrap(*arg, **kwargs):
        if 'logged_in' in session:
            return func(*arg, **kwargs)
        else:
            return redirect('/')
    return wrap



if os.getenv("VERCEL_ENV"):  # on vercel 
    from .user.routes import *
else:  # Local
    import user.routes

@app.route('/', methods=('GET', 'POST'))
def welcomepage():
    return render_template('user-authentication.html')

@app.route('/home', methods=('GET', 'POST'))
@login_required
def home():
    ''' landing page with active lists "closed" === "false" '''
    zakupy  = list(Zakupy.get_zakupy("false"))
    no_products = [{'count': '2'}, {'count': '12'}]
        
    return render_template('home.html', zakupy = zakupy, no_products=no_products)

@app.route('/history', methods=('GET', 'POST'))
@login_required
def historical_lists():
    ''' page with closed lists "closed" === "true" '''
    zakupy  = list(Zakupy.get_zakupy("true"))

    return render_template('historical-shopping-lists.html', zakupy = zakupy)


@app.route('/shopping-list/<id>')
@login_required
def lista_zakupow(id):
    ''' opens selected list active ?'''
    shopping_list  = Produkt.get_shopping_list(id)
    list_details = Zakupy.get_list_details(id)
    if shopping_list:
        return render_template('lista_zakupow.html', shopping_list=list(shopping_list), id=id, list_details=list_details)
    else:
        return render_template('404.html'), 404


@app.route('/delete-shopping-list/<id>', methods=['GET', 'POST'])
@login_required
def delete_shopping_list(id):
    try:
        db.produkty.delete_many({"id_zakupy": ObjectId(id)})
        db.zakupy.delete_one({"_id":ObjectId(id)})
        return jsonify({"message": "Shopping list has beend removed from the database", "id": id}), 201
    except Exception as e:
        print(f"Error in delete_shopping_list route: {e}")
        return jsonify({"error": "An unexpected error occurred when deleting the shopping list form database"}), 500


@app.route('/add-shopping-list', methods=['POST'])
@login_required
def create_shopping_list():
    '''
    creates a new shopping lists
    '''
    try:
        geo_data = request.get_json()
        if not geo_data:
            return jsonify({"error": "Invalid input"}), 400
        id = Zakupy.create_new_shopping_list(geo_data)
        if id:
            return jsonify({"message": "List crreated ", "id": id}), 201
        else:
            return jsonify({"error": "Failed to create a new list"}), 500
    except Exception as e:
        print(f"Error in create_shopping_list route: {e}")
        return jsonify({"error": "An unexpected error occurred when trying to add a new product"}), 500
    

@app.route('/change-list-status', methods=['POST'])
@login_required
def change_list_status():
    ''':changes list's "close" status  '''
    try:
        data = request.get_json()
        id = data['id']
        close = data['close']
        if not id:
            return  jsonify({"error": "Invalid input. List cannot be archived"}), 400
        result = Zakupy.udpate_close_status(id, close)
        if result:
            return jsonify({"message": "List closed ", "id": id}), 201
        else:
            return jsonify({"error": "Failed to change list's 'close' status"}), 500

    except Exception as e:
        print(f"Error in close_list route: {e}")
        return jsonify({"error": "An unexpected error occurred when trying to close the list"}), 500





@app.route('/add-product', methods=['POST'])
@login_required
def add_new_product():
    ''' adds new product to the shopping list
        js will handls adding details to UI
        error handlers needed in case something goes wrong then redirect will be needed
    '''
    try:
        # gets data from UI
        product_details = request.get_json()
        print(product_details)
        if not product_details:
            return jsonify({"error": "Invalid input"}), 400
        product_details = Produkt.add_product(product_details)
        if product_details['_id']:
            return jsonify({"message": "Product added successfully", "product_details": product_details}), 201
        else:
            return jsonify({"error": "Failed to add product"}), 500
    except Exception as e:
        print(f"Error in add_product route: {e}")
        return jsonify({"error": "An unexpected error occurred when trying to add a new product"}), 500




@app.route('/delete-product', methods=['POST'])
@login_required
def remove_product():
    """
    - reoves the product from the database 
    """
    try:
        product_details = request.get_json()
        if not product_details:
            return jsonify({"error": "Invalid product_id"}), 400
        result = Produkt.delete_product( product_details['product_id'])
        if result:
             return jsonify({"message": f"Product removed successfully {product_details['name']}" }), 201
        else:
            return jsonify({"error": "Failed to remove product"}), 500
    except Exception as e:
        print(f"Error in remove_product route: {e}")
        return jsonify({"error": "An unexpected error occurred when trying to add a new product"}), 500





@app.route('/update-product-status', methods=['POST'])
@login_required
def update_product_status():
    """:changes product status"""
    try:
        product_details = request.get_json()
        if not product_details:
            return jsonify({"error": "Issues with data passed to the backend"}), 400
        result = Produkt.update_product_status(product_details)
        if result:
             return jsonify({"message": f"Status changed", "purchase_date":  result["purchase_date"]}), 201
        else:
            return jsonify({"error": "Failed to chanege product's status"}), 500
    except Exception as e:
        print(f"Error in remove_product route: {e}")
        return jsonify({"error": "An unexpected error occurred when trying to update product's"}), 500





@app.errorhandler(404)
def page_not_found(e):
    return render_template('404.html'), 404

if __name__ == '__main__':
    app.run(debug=True)
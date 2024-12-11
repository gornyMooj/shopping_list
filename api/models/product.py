from flask import jsonify
from bson.objectid import ObjectId
from datetime import datetime

from basic import db

class Produkt: 
    @staticmethod
    def add_product(product_details):
        '''
        :param product_data: dictionary containing product details.
        :returns: inserted product ID or error message.
        '''

        print('product_details MODEL', product_details)
        
        try:
            product_details['added_date'] = datetime.now()
            product_details['purchase_date'] = None
            product_details['id_zakupy'] = ObjectId(product_details['id_zakupy'])

            # Insert into the database
            result = db.produkty.insert_one(product_details)
            product_details['id_zakupy'] = str(product_details['id_zakupy'])
            product_details['_id'] = str(result.inserted_id)
            product_details['added_date'] = product_details['added_date'].strftime("%d %b %Y %H:%M") 
            return product_details
        except Exception as e:
            print(f"Error adding product: {e}")
            return None
        
    @staticmethod
    def delete_product(id):
        '''
        :param id zakupy
        :returns: True if sucess or none is error
        '''
        try:
            db.produkty.delete_one({"_id":ObjectId(id)})
            return True
        except Exception as e:
            print(f"Error adding product: {e}")
            return None
        
    @staticmethod
    def get_shopping_list(id):
        try:
            shopping_list  = db.produkty.find({"id_zakupy": ObjectId(id)})
            return shopping_list
        except Exception as e:
            print(f"Error fetching shopping list by id: {e}")
            return None
        
    @staticmethod
    def update_product_status(product_details):
        try:
            if product_details['purchase_date'] == 'None':
                # meas that the product was marked in UI as bougt  
                product_details['purchase_date'] = datetime.now()
            else:
                # means the product was set as not bought so we need to set its coordinates as 'Unknown' as well as purchase_date
                product_details['purchase_date'] = None            
                product_details['lat'] = 'Unknown'
                product_details['long'] = 'Unknown'
            
            result = db.produkty.update_one(
                {"_id": ObjectId(product_details['product_id'])},
                {
                "$set": {
                    "purchase_date": product_details['purchase_date'],
                    "lat": product_details['lat'],
                    "long": product_details['long']
                }
                }
            )
            # returning  product_details on sucess 
            if not product_details['purchase_date']:
                return {'purchase_date' : product_details['purchase_date']} # None
            else:
                datetime_string = product_details['purchase_date'].strftime("%d %b %Y %H:%M") 
                return {'purchase_date': datetime_string}
        except Exception as e:
            print(f"Error whne changing status of the product in the backend: {e}")
            return None
        
    

        

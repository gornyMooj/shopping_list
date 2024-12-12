from flask import jsonify, session
from bson.objectid import ObjectId
from datetime import datetime
import os

if os.getenv("VERCEL_ENV"):  # Set on Vercel
    from ..basic import db
else:  # Local
    from basic import db

class Zakupy:
    @staticmethod
    def get_zakupy(closed):
        '''
        :returns: number of products per shopping list with close satatus
        '''
        try:
            query = [
        {
            "$match": {
                "closed": f"{closed}",
                "user": f"{session['user']['_id']}"
            }
        },
        {
            "$lookup": {
                "from": "produkty",
                "localField": "_id",
                "foreignField": "id_zakupy",
                "as": "products"
            }
        },
        {
            "$addFields": {
                "count": { "$size": "$products" }
            }
        },
        {
            "$project": {
                "name": 1,
                "display_name": 1,
                "created_date": 1,
                "products_bought": 1,
                "closed": 1,
                "historical": 1,
                "closed_date": 1,
                "count": 1
            }
        }
    ]
            no_products = db.zakupy.aggregate(query)
            return no_products
        except Exception as e:
            print(f"Error fething data for zakupy with 'closed' status {closed} : {e}")
            return None
    
    @staticmethod
    def get_list_details(id):
        try:
            list_details = db.zakupy.find_one({"_id": ObjectId(id), "user": session['user']['_id'] })
            return list_details
        except Exception as e:
            print(f"Error fething data of the shoping list: {id} -> Error: {e}")
            return None

    @staticmethod
    def create_new_shopping_list(geo_data):
        
        try:
            new_shopping_list = {
                'name': geo_data['name'],
                'display_name': geo_data['display_name'],
                'created_date': datetime.now(),
                'products_bought': 'no',
                'closed': "false",
                'historical': "false",
                'closed_date': datetime.now(),
                'user': session['user']['_id']
            }
            result = db.zakupy.insert_one(new_shopping_list)
            return str(result.inserted_id)
        except Exception as e:
            print(f"Error while inserting a new shopping list to the database: {e}")
            return None    
    
    @staticmethod
    def udpate_close_status(id, close):
        try:
            result = db.zakupy.update_one(
                {"_id": ObjectId(id)},               
                {"$set": {"closed": close}}                   
            )
            # if sucesfull returns one if the document was found and moddified
            if result.matched_count:
                print(f"List 'closed' was changed to {close} - {id}")
                return True
            else:
                print(f"Could not change the list status to {close} because no document found with the given ID {id}.")
        except Exception as e:
            print(f"Error while changing the 'close' to {close} of the list {id} - error: {e}")
            return False    
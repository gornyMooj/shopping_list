from flask import Flask, jsonify, request, session, redirect
from passlib.hash import pbkdf2_sha256
import os

if os.getenv("VERCEL_ENV"):  # Set on Vercel
    from ..basic import db
else:  # Local
    from basic import db

class User:
    def start_session(self, user):
        # seleting password before saving it to session
        del user['password']
        session['logged_in'] = True
        session['user'] = user
        print(user)
        return jsonify(user), 200

    def signup(self):
        # create the user
        data = request.get_json()
        
        user = {
            "name": data['name'],
            "email": data['email'],
            "password": data['password'],
        }

        # Encrypt the password
        user['password'] = pbkdf2_sha256.encrypt(user['password'])

        # Check for the existing email address
        if db.users.find_one({"email": user['email']}):
            print("Email address already in use")
            return jsonify({"error": "Email address already in use"}), 400

        # Insert the user into the database
        if db.users.insert_one(user):
            db.users.find_one({"email": user['email']})
            # Add the inserted ID to the user object and convert it to a string
            user['_id'] = str(user['_id'])
            return self.start_session(user)
        
        return jsonify({"error": "Signup failed"}), 400
    
    def signout(self):
        session.clear()
        return redirect('/')
    
    def login(self):
        data = request.get_json()

        user = db.users.find_one({"email": data['email']})

        if user and pbkdf2_sha256.verify(data['password'], user['password']):
            # Add the inserted ID to the user object and convert it to a string
            user['_id'] = str(user['_id'])
            return self.start_session(user)
        
        return jsonify({"error": "Invalid login credentials"}), 401
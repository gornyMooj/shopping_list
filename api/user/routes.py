# the file holds all routes related to the user

from flask import Flask, render_template
import os

if os.getenv("VERCEL_ENV"):  # Set on Vercel
    from ..basic import app
    from .models import User
else:  # Local
    from __main__ import app
    from user.models import User

@app.route('/user/signup', methods=['POST'])
def signup():
  return User().signup()


@app.route('/user/signout')
def signout():
  return User().signout()


@app.route('/user/login', methods=['POST'])
def login():
  return User().login()

@app.route('/test')
def test():
  return render_template('user-authentication.html')


# the file holds all routes related to the user

from flask import Flask, render_template
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


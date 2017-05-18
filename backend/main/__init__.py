from flask import Blueprint
import sys

main = Blueprint('main', __name__, static_folder='static', template_folder='templates')

from . import apis
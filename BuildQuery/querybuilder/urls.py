# urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('api/tables/', views.get_tables, name='get_tables'),
    path('api/query/', views.execute_query, name='execute_query'),
]

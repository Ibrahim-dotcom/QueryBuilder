from django.urls import path
from . import views

urlpatterns = [
    path('api/database-info/', views.get_database_info, name='get_database_info'),
    path('api/execute-query/', views.execute_custom_query, name='execute_custom_query'),

    path('api/tables/', views.get_tables, name='get_tables'),
    path('api/columns/<str:table_name>/', views.get_table_columns, name='get_table_columns'),

    path("api/save-query/", views.save_query, name="save_query"),
    path("api/fetch-queries/", views.fetch_queries, name="fetch_queries"),
]

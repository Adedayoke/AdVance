SWAGGER_TEMPLATE = {
    "swagger": "2.0",
    "info": {
        "title": "OOH Campaign Management API",
        "description": "API documentation for the OOH campaign and advertisement management backend.",
        "version": "1.0.0",
    },
    "basePath": "/",
    "schemes": ["http", "https"],
}

SWAGGER_CONFIG = {
    "headers": [],
    "specs": [
        {
            "endpoint": "apispec_1",
            "route": "/apispec_1.json",
            "rule_filter": lambda rule: True,
            "model_filter": lambda tag: True,
        }
    ],
    "static_url_path": "/flasgger_static",
    "swagger_ui": True,
    "specs_route": "/apidocs/",
}

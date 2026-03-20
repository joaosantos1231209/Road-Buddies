```mermaid
---
title: Diagrama de Arquitetura da Base de Dados
---
erDiagram
    %% Tabelas e Atributos Principais
    USERS {
        string id PK
        string username
        string email
        string phone
        string avatar_url
        boolean is_email_verified
        boolean is_admin
        string personal_vehicle_info
        timestamp created_at
        timestamp updated_at
    }

    TRIPS {
        int id PK
        string user_id FK
        string status 
        int origin_id FK
        int destination_id FK
        timestamp departure_time
        int available_seats
        string vehicle_type 
        string trip_vehicle_details 
        boolean hidden
    }

    TRIP_PARTICIPANTS {
        int id PK
        int trip_id FK
        string user_id FK
        string status
    }

    MESSAGES {
        int id PK
        string sender_id FK
        string receiver_id FK
        int trip_id FK
        string content
        boolean read
    }

    MATCHES {
        int id PK
        int provider_trip_id FK
        int seeker_trip_id FK
    }

    CITIES {
        int id PK
        string name
        boolean is_active
        boolean is_office
    }

    SP_REQUESTS {
        int id PK
        string user_id FK
        int destination_id FK
        timestamp date_needed 
        string justification 
        timestamp created_at 
    }

    %% Relações (Foreign Keys)
    USERS ||--o{ TRIPS : "cria (1:N)"
    USERS ||--o{ TRIP_PARTICIPANTS : "junta-se a (1:N)"
    USERS ||--o{ MESSAGES : "envia / recebe (1:N)"
    USERS ||--o{ SP_REQUESTS : "solicita viatura (1:N)"
    
    TRIPS ||--o{ TRIP_PARTICIPANTS : "contém (1:N)"
    TRIPS ||--o{ MESSAGES : "contextualiza (1:N)"
    TRIPS ||--o{ MATCHES : "emparelha com (1:N)"
    
    CITIES ||--o{ TRIPS : "origem / destino (1:N)"
    CITIES ||--o{ SP_REQUESTS : "destino (1:N)"
```
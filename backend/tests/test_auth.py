def test_register_user(client):
    response = client.post(
        "/api/auth/register",
        json={
            "name": "Jane Doe",
            "email": "jane@example.com",
            "password": "strongpassword123",
            "role": "patient"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Jane Doe"
    assert data["email"] == "jane@example.com"
    assert data["role"] == "patient"
    assert "id" in data
    assert "password_hash" not in data


def test_register_duplicate_user(client):
    # First registration
    client.post(
        "/api/auth/register",
        json={
            "name": "Jane Doe",
            "email": "jane@example.com",
            "password": "strongpassword123",
            "role": "patient"
        }
    )
    # Second registration with same email
    response = client.post(
        "/api/auth/register",
        json={
            "name": "Jane Copy",
            "email": "jane@example.com",
            "password": "anotherpassword",
            "role": "caregiver"
        }
    )
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]


def test_login_user(client):
    # Register first
    client.post(
        "/api/auth/register",
        json={
            "name": "Jane Doe",
            "email": "jane@example.com",
            "password": "strongpassword123",
            "role": "patient"
        }
    )
    
    # Successful login
    response = client.post(
        "/api/auth/login",
        json={
            "email": "jane@example.com",
            "password": "strongpassword123"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["role"] == "patient"
    assert data["email"] == "jane@example.com"
    
    # Failed login - incorrect password
    response_fail_pw = client.post(
        "/api/auth/login",
        json={
            "email": "jane@example.com",
            "password": "wrongpassword"
        }
    )
    assert response_fail_pw.status_code == 403
    
    # Failed login - incorrect email
    response_fail_email = client.post(
        "/api/auth/login",
        json={
            "email": "nonexistent@example.com",
            "password": "strongpassword123"
        }
    )
    assert response_fail_email.status_code == 403

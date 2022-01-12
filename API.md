# API
## API URL
The base URL for all API calls is `/_backend/api.`

<br>
<br>

## Get poll information
----
Fetch JSON data of a single poll defined by the poll ID string.

* **URL**
  
  /poll/:id

* **Method:**
  
  `GET`
  
*  **URL Params**
   
   **Required:**
   
   `id=[alphanumeric]`

* **Data Params**

  None

* **Success Response:**

  * **Code:** 200 <br />
    **Content:**
    ```json
    {
        "id": "abcd1234",
        "title": "An API requested Poll",
        "dupeCheckMode": "ip",
        "multiSelect": true,
        "creationTime": "2022-01-12T19:26:37.262Z",
        "options": [
            "Option A",
            "Option B",
            "Option C"
        ]
    }
    ```
 
* **Error Response:**

  * **Code:** 404 NOT FOUND <br />
    **Content:**
    ```json
    {
        "error" : "Poll not found"
    }
    ```

  OR

  * **Code:** 500 INTERNAL SERVER ERROR <br />
    **Content:**
    ```json
    {
        "error" : "<ERROR_MESSAGE_STRING>"
    }
    ```

## Get poll result
----
Fetch JSON data of the result of a single poll defined by the poll ID string.

* **URL**
  
  /poll-result/:id

* **Method:**
  
  `GET`
  
*  **URL Params**
   
   **Required:**
   
   `id=[alphanumeric]`

* **Data Params**

  None

* **Success Response:**

  * **Code:** 200 <br />
    **Content:**
    ```json
    {
        "title": "An API requested Poll",
        "options": {
            "Option A": 0,
            "Option B": 3,
            "Option C": 1
        }
    }
    ```
 
* **Error Response:**

  * **Code:** 404 NOT FOUND <br />
    **Content:**
    ```json
    {
        "error" : "Poll not found"
    }
    ```

  OR

  * **Code:** 500 INTERNAL SERVER ERROR <br />
    **Content:**
    ```json
    {
        "error" : "<ERROR_MESSAGE_STRING>"
    }
    ```

## Create a poll
----
Create a new poll and return its id

* **URL**
  
  /poll

* **Method:**
  
  `POST`
  
*  **URL Params**
   
   None

* **Data Params**

  **Required:**

   `options=[string][]`

  **Optional:**

   `title=[alphanumeric]`

   `dupeCheckMode="ip" | "cookie" | "none"`

   `multiSelect=[boolean]`

* **Success Response:**

  * **Code:** 200 <br />
    **Content:**
    ```json
    {
        "id": "abcd1234"
    }
    ```
 
* **Error Response:**

  * **Code:** 400 BAD REQUEST <br />
    **Content:**
    ```json
    {
        "error" : "<ERROR_MESSAGE_STRING>"
    }
    ```
    **Possible Error Messages:**
    - `Options must be an array and have at least 2 different entries`
    - `Only <<MAX_POLL_OPTIONS>> options are allowed`

  OR

  * **Code:** 500 INTERNAL SERVER ERROR <br />
    **Content:**
    ```json
    {
        "error" : "<ERROR_MESSAGE_STRING>"
    }
    ```
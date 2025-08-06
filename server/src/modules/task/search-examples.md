# Simplified Task Search Functionality

## 🚀 **Overview**

The simplified task search functionality provides easy-to-use filtering capabilities with smart type detection. This implementation supports basic search across all task fields with automatic type handling.

## 🔍 **Search Fields**

### **String Fields** (case-insensitive contains search)

- `name` - Task name
- `status` - Task status
- `priority` - Task priority
- `link` - Task link
- `text1`, `text2`, `text3`, `text4`, `text5` - Custom text fields
- `select1`, `select2`, `select3`, `select4`, `select5` - Custom select fields
- `link1`, `link2`, `link3`, `link4`, `link5` - Custom link fields

### **Number Fields** (exact match)

- `price` - Task price
- `number1`, `number2`, `number3`, `number4`, `number5` - Custom number fields

### **Boolean Fields** (exact match)

- `paid` - Whether task is paid
- `checkbox1`, `checkbox2`, `checkbox3`, `checkbox4`, `checkbox5` - Custom checkbox fields

### **Date Fields** (exact match)

- `date1`, `date2`, `date3`, `date4`, `date5` - Custom date fields

## 📝 **API Usage Examples**

### **1. Basic Search**

```bash
# Search by task name
GET /api/v1/task/sheet-id?search[0][key]=name&search[0][value]=urgent

# Search by status
GET /api/v1/task/sheet-id?search[0][key]=status&search[0][value]=open
```

### **2. Multiple Search Criteria**

```bash
# Tasks with name containing "urgent" AND status equals "open"
GET /api/v1/task/sheet-id?search[0][key]=name&search[0][value]=urgent&search[1][key]=status&search[1][value]=open
```

### **3. Number Search**

```bash
# Tasks with price 100
GET /api/v1/task/sheet-id?search[0][key]=price&search[0][value]=100
```

### **4. Boolean Search**

```bash
# Paid tasks only
GET /api/v1/task/sheet-id?search[0][key]=paid&search[0][value]=true
```

### **5. Date Search**

```bash
# Tasks with specific date
GET /api/v1/task/sheet-id?search[0][key]=date1&search[0][value]=2024-01-15
```

### **6. Search with Pagination**

```bash
# Search with pagination
GET /api/v1/task/sheet-id?search[0][key]=name&search[0][value]=task&page=1&limit=10&order=desc
```

## 💻 **JavaScript/TypeScript Examples**

### **Using fetch**

```javascript
const searchParams = new URLSearchParams({
  'search[0][key]': 'name',
  'search[0][value]': 'urgent',
  'search[1][key]': 'status',
  'search[1][value]': 'open',
  page: '1',
  limit: '10',
  order: 'desc',
})

const response = await fetch(`/api/v1/task/sheet-id?${searchParams}`)
const data = await response.json()
```

### **Using axios**

```javascript
const response = await axios.get('/api/v1/task/sheet-id', {
  params: {
    search: [
      { key: 'name', value: 'urgent' },
      { key: 'status', value: 'open' },
    ],
    page: 1,
    limit: 10,
    order: 'desc',
  },
})
```

## 🎯 **Smart Type Detection**

The search automatically detects field types and applies appropriate search logic:

- **String fields**: Case-insensitive contains search
- **Number fields**: Exact numeric match
- **Boolean fields**: Exact boolean match (accepts "true"/"false", true/false, or "1"/"0")
- **Date fields**: Exact date match (accepts ISO date strings)

## 🔧 **Error Handling**

The search functionality includes comprehensive error handling:

- **Invalid field names**: Returns validation error with valid fields list
- **Invalid values**: Returns specific error for the problematic field
- **Type mismatches**: Returns error explaining expected type
- **Empty values**: Ignored with warning

## 📈 **Response Format**

```json
{
  "tasks": [
    {
      "id": "task-id",
      "name": "Urgent Task",
      "status": "open",
      "priority": "high",
      "price": 150,
      "paid": true,
      "members": [...],
      "chat": {...}
    }
  ],
  "pagination": {
    "page": 1,
    "pages": 5,
    "limit": 10,
    "count": 50
  }
}
```

## 🎉 **Key Features**

✅ **Simple & Intuitive** - Easy to use search interface  
✅ **Smart Type Detection** - Automatic handling of different data types  
✅ **Multiple Conditions** - Combine multiple search filters with AND logic  
✅ **Case-Insensitive** - String searches are case-insensitive  
✅ **Pagination** - Efficient handling of large datasets  
✅ **Error Handling** - Clear validation and error messages  
✅ **TypeScript Support** - Full type safety throughout  
✅ **Performance Optimized** - Efficient database queries

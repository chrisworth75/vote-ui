# Vote UI

Vanilla JavaScript frontend for the Vote application with D3.js pie chart visualizations.

## Features

- User registration and login (no password required)
- View all available polls
- Vote on polls
- Real-time D3.js pie chart visualization of poll results
- Track which polls you've already voted on

## Technologies

- Vanilla JavaScript (no framework)
- D3.js v7 for pie chart visualizations
- CSS3 with gradient backgrounds
- LocalStorage for session management

## Build and Run

```bash
docker build -t vote-ui .
docker run --name vote-ui -p 3005:80 -d vote-ui
```

Access at: http://localhost:3005

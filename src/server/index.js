const express = require('express');

const PORT = process.env.PORT || 4000;
const app = express();

const { storyApi } = require('./api');

// hacky!! fix
const storypageHtml = `<head>
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
	<link href="https://fonts.googleapis.com/css2?family=Alice&display=swap" rel="stylesheet">

	<style>
	body {
		background-color: black;
	}

	div.storyTextContainer {
		padding: 12px;
		color: #d3c8ab;
		font-size: 24px;
		font-family: Alice;
		position:  absolute;
		top:  2em;
		left:  50%;
		margin-right: -50%;
		transform: translate(-50%, -50%);
	}
	</style>
</head>
<body><div class="storyTextContainer">__STORY_TEXT__</body>`

// app.engine('html', require('ejs').renderFile);
// app.set('view engine', 'html');

app.get('/', (req, res) => {
  res.send('Hello World!')
});

app.get('/story/get', async (req, res) => {
  const numStories = 1;
  console.log(`Making request to storyApi (numStories=${numStories})`);
  try {
  	const stories = await storyApi.getStories(numStories);
  	console.log(`Received response from storyApi.getStories(): ${JSON.stringify(stories)}`);
  	const html = storypageHtml.replace('__STORY_TEXT__', stories[0]);
  	res
  		.header('Content-Type', 'text/html')
  		.send(html);
  } catch (e) {
  	const errMessage = `Error making request to storyApi: ${e.message}`;
  	console.error(errMessage);
  	res.send(errMessage);
  }
});

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
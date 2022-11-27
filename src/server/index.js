const express = require('express');

const PORT = process.env.PORT || 4000;
const app = express();

const { StoryApi } = require('./api');

let _storyApi;

function getStoryApi() {
	if (!_storyApi) {
		_storyApi = new StoryApi();
	}
	return _storyApi;
}

// hacky!! load from static file instead & fix
const storypageHtml = `<head>
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
	<link href="https://fonts.googleapis.com/css2?family=Alice&display=swap" rel="stylesheet">

	<style>
	body {
		background-color: #040300;
		// background-image: url('../black-leather-seamless.jpg');
	}

  div.storyTextContainer {
		padding: 1rem;
		color: #e8d6a7;
		text-align: center;
		font-size: 2rem;
		text-size-adjust: 500%;
		font-family: Alice;
		position:  absolute;
		left:  50%;
		margin-right: -50%;
		transform: translate(-50%, 0%);
	}

	@media screen and (max-width: 800px) {
  		div.storyTextContainer {
    		padding: 2rem;
		}
  }
	</style>
</head>
<body><div class="storyTextContainer">__STORY_TEXT__</div></body>`;

app.get('/', (req, res) => {
  res.send('Hello World!')
});

app.get('/story', async (req, res) => {
  const numStories = 1;
  console.log(`Making request to storyApi (numStories=${numStories})`);
  try {
  	const stories = await getStoryApi().getStoriesAsJson(numStories);
  	console.log(`Received response from storyApi.getStoriesAsJson(): ${JSON.stringify(stories)}`);
  	const html = storypageHtml.replace('__STORY_TEXT__', stories[0].text);
  	res
  		.header('Content-Type', 'text/html')
  		.send(html);
  } catch (e) {
  	const errMessage = `Error making request to storyApi: ${e.message}`;
  	console.error(errMessage);
  	res.send(errMessage);
  }
});

app.use(express.static('./src/server/static/images'));

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
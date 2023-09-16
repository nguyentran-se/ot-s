const app = require('express')();
const cors = require('cors');
let chrome = {};
let puppeteer = require('puppeteer-core');

if (process.env.AWS_LAMBDA_FUNCTION_VERSION) {
  chrome = require('chrome-aws-lambda');
  puppeteer = require('puppeteer-core');
} else {
  puppeteer = require('puppeteer');
}
// app.use(
//   cors({
//     origin: '*',
//     methods: 'GET',
//   })
// );
app.get('/api/scraping', async (req, res) => {
  let options = {};
  const url = req.query.url;
  console.log('start scraping: ', url);
  if (process.env.AWS_LAMBDA_FUNCTION_VERSION) {
    options = {
      args: [...chrome.args, '--hide-scrollbars', '--disable-web-security'],
      defaultViewport: chrome.defaultViewport,
      executablePath: await chrome.executablePath,
      headless: true,
      ignoreHTTPSErrors: true,
    };
  }

  try {
    let browser = await puppeteer.launch(options);

    let page = await browser.newPage();
    page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.75 Safari/537.36');
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 0 });

    const text = await page.$eval('script#__NEXT_DATA__[type="application/json"]', (el) => el.textContent);
    if (!text) {
      await browser.close();
      return res.status(200).json(null);
    }
    await browser.close();
    const data = JSON.parse(text);
    res.setHeader('Access-Control-Allow-Credentials', true)
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.status(200).json(data.props.initialReduxState.pageRestaurantDetail);
  } catch (err) {
    console.log(err);
    throw err;
  }
});

const server = app.listen(process.env.PORT || 3000, () => {
  console.log('OT-S Server started');
});
server.setTimeout(60 * 1000);

module.exports = app;

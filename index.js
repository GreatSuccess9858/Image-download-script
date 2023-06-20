import fs from 'fs';
import csv from 'csv-parser';
import axios from 'axios';
import fetch from 'node-fetch';
import jsdom from 'jsdom';
import cheerio from 'cheerio';
import https from 'https';
const { JSDOM } = jsdom;

const stream = fs.createReadStream('./ccc.csv')
  .pipe(csv());

let csvData = [];
let fromNum = 108610;

await stream.on('data', async (data) => {
    await csvData.push({name: data[Object.keys(data)[0]].replaceAll('/', '-').replaceAll('.', ''), detail: data[Object.keys(data)[1]]});
});

async function getData(img, path) {
  const file = await fs.createWriteStream(path);
  return new Promise((resolve, reject) => {
    const req = https.get(img, async (res) => {
      console.log('----------', img)
      res.pipe(file);
      file.on('finish', () => {
        file.close()
        resolve()
      })
    });

    req.on('error', (error) => {
      reject(error);
    });
  });
}

await stream.on('end', async () => {
    let i = 0;
    for (const cData of csvData) {
        let index = i + fromNum;
        console.log('----------------------', index)
        await fs.promises.mkdir(`./${index}.${cData.name}`)
        console.log('==--=-=-=-=-=-=-=-=', index)
        await fs.promises.mkdir(`./${index}.${cData.name}/${'Doc'}`)
        await fs.promises.mkdir(`./${index}.${cData.name}/${'Image'}`)
        await fs.promises.mkdir(`./${index}.${cData.name}/${'Image'}/Diagram`)
        await fs.promises.mkdir(`./${index}.${cData.name}/${'Image'}/Body`)

        const imageUrls = [];

        for (let start = 0; start < 200; start += 20) {
          const url = `https://www.google.com/search?q=${encodeURIComponent(cData.detail)}&tbm=isch&start=${start}`;
          const response = await axios.get(url);
          const $ = cheerio.load(response.data);
    
          $('img').each((index, element) => {
            const url = $(element).attr('src');
            if (url && url.startsWith('http')) {
              imageUrls.push(url);
            }
          });
        }
        let imageNum = 1;
        for (const img of imageUrls) {
            console.log(i, '----------', imageNum)
            const response = await getData(img, `./${index}.${cData.name}/Image/Body/image${imageNum}.jpg`);
            imageNum ++;
        }
        i++;
    }
});

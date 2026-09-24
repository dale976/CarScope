import {test,expect} from 'bun:test';
import {renderToStaticMarkup} from 'react-dom/server';
import {CarDetailPage} from '../src/client/CarDetailPage';
import {projectListing} from '../src/shared/listing';
import {liveDetailData} from '../src/shared/detail';
import {detailExamples,exampleComparisons} from '../src/shared/detail-example';
test('response-shaped fictional fixtures use live mapping and shared page, without calls',()=>{
 for(const example of detailExamples){
  const data=liveDetailData(projectListing(example.response),exampleComparisons.map(projectListing),'fictional');
  const html=renderToStaticMarkup(<CarDetailPage data={data} photo={<span>Sample photo</span>} preferences={[{label:'Carbon seats',priority:'must'}]} back={()=>{}} open={()=>{}}/>);
  expect(html).toContain('Price history');expect(html).toContain('Compare the market');
  expect(html).toContain('Other advertised equipment');expect(html).toContain('Read seller description');
  expect(html).not.toContain('<input');expect(html).not.toContain('<details open');expect(html).not.toContain('NaN');
 }
 const missing=liveDetailData(projectListing(detailExamples[1]!.response),[],'fictional');
 const html=renderToStaticMarkup(<CarDetailPage data={missing} photo={null} back={()=>{}} open={()=>{}}/>);
 expect(html).toContain('No dated price observations supplied.');expect(html).not.toContain('<svg');
});

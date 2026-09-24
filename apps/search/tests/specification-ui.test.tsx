import {test,expect} from 'bun:test';
import {renderToStaticMarkup} from 'react-dom/server';
import {SpecificationMatch} from '../src/client/SpecificationMatch';
const car={id:'synthetic',make:'Porsche',model:'911',features:['Carbon seats']};
test('detail requirements are read-only with evidence and an explicit edit action',()=>{
 const html=renderToStaticMarkup(<SpecificationMatch car={car} fictional={false} preferences={[{label:'Carbon seats',priority:'must'},{label:'Sport Chrono',priority:'nice'}]} onEdit={()=>{}} liveEvidence={{features:car.features,options:[],description:''}}/>);
 expect(html).toContain('Your requirements');expect(html).toContain('Edit search preferences');
 expect(html).toContain('Advertised as fitted');expect(html).toContain('Not confirmed');
 expect(html).not.toContain('<input');expect(html).not.toContain('<select');
 expect(html).not.toContain('<details open');
});
test('empty live requirements do not silently select demo defaults',()=>{
 const html=renderToStaticMarkup(<SpecificationMatch car={car} fictional={false} preferences={[]} onEdit={()=>{}}/>);
 expect(html).toContain('No equipment preferences selected.');expect(html).not.toContain('checked=""');
});
test('unknown must-haves remain visible',()=>{
 const html=renderToStaticMarkup(<SpecificationMatch car={car} fictional={false} preferences={[{label:'Front axle lift',priority:'must'}]} liveEvidence={{features:[],options:[],description:''}}/>);
 expect(html).toContain('Must-have');expect(html).toContain('Not confirmed');expect(html).toContain('Front axle lift');
});

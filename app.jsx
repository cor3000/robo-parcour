import React from './fakeReact';
import {Component} from './fakeReact';
import bar from './bar';

const obj = {a: 12, b: 13};
const obj2 = {a: 20, obj};
const obj3 = {...obj, a: 333, c:34};

console.log(obj, obj2, obj3);

class Bla extends Component {
	constructor(props, children) {
		super(props, children);
		console.log(props, children);
	}
	
	render(props, children) {
		return <div className='bla' {...props}>
			{children}
		</div>
	}
}
const d = <div>
			<button>whoo</button>
			<input value="asdf"/>
		</div>;

const e = <Bla more="some more">input</Bla>;
document.body.appendChild(d);
document.body.appendChild(e);

const mystring = `SOME ${obj.a} VALUE`;
console.log(mystring);

bar();
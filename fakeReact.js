/*adapted from http://stackoverflow.com/questions/30430982/can-i-use-jsx-without-react-to-inline-html-in-script*/
class Component {
	render(props, children) {}
};

const React = {
    createElement: function (tag, attrs, children) {
		
		let element;
		
		if(typeof tag === 'function') {
			element = new tag(attrs, children).render(attrs, children);
		} else {
			element = document.createElement(tag);
			for (let name in attrs) {
				if (name && attrs.hasOwnProperty(name)) {
					let value = attrs[name];
					if (value === true) {
						element.setAttribute(name, name);
					} else if (value !== false && value != null) {
						element.setAttribute(name, value.toString());
					}
				}
			}
			for (let i = 2; i < arguments.length; i++) {
				let child = arguments[i];
				if(child) {
					element.appendChild(
						child.nodeType == null ?
							document.createTextNode(child.toString()) : child);
				}
			}
		}
        return element;
    }
};

export {Component};
export default React;
import {Directive, Input, Output, EventEmitter, HostListener, ElementRef, ViewContainerRef,
	ComponentResolver, ComponentFactory, ComponentRef, Renderer, Injector, ApplicationRef} from '@angular/core';
import {NgModel} from '@angular/common';
import {AutoCompleteGroup} from '../models/auto-complete-group';
import {AutoCompleteTmplComponent} from './auto-complete.directive.tmpl';

const LIST_CONTAINER_CLASS:string = 'auto-complete-matches';
const DEFAULT_OFFSET_MARGIN:number = 5;
const DEFAULT_MIN_LENGTH:number = 3;
let defaultAutoCompleteOptions:any = {
	minLength: DEFAULT_MIN_LENGTH,
	clipToBody: false,
	position: 'bottom',
	isGrouped: false,
	cssClasses: {
		list: 'auto-complete-list',
		group: 'auto-complete-group',
		item: 'auto-complete-item'
	}
};

@Directive({
	selector: '[autoComplete][ngModel]'
})
export class AutoCompleteDirective {
	container:AutoCompleteTmplComponent;
	private options:any;

	@Input() autoComplete:any[];

	@Input() set autoCompleteOptions(options:any) {
		if (this.options) {
			if (this.options !== options) {
				this.options = Object.assign(this.options, options);
				this.container.setPosition(this.calculatePosition());
			}
		} else {
			this.options = Object.assign(defaultAutoCompleteOptions, options);
		}
	}

	@Input() set resetAutoComplete(val:boolean) {
		if (val) {
			this.resetQuery();
		}
	}

	@Output() onSelected:EventEmitter<any> = new EventEmitter<any>();

	@HostListener('keyup', ['$event'])
	protected onChange(e:KeyboardEvent):void {
		if (this.container) {
			// esc
			if (e.keyCode === 27) {
				this.hide();
				return;
			}

			// up
			if (e.keyCode === 38) {
				this.container.previousActiveItem();
				return;
			}

			// down
			if (e.keyCode === 40) {
				this.container.nextActiveItem();
				return;
			}

			// enter
			if (e.keyCode === 13) {
				this.container.selectActiveItem();
				return;
			}

			if (this.modelInstance.model && this.modelInstance.model.length >= this.options.minLength) {
				this.provideMatches(this.modelInstance.model);
			} else {
				// Not enough characters typed? Hide the popup.
				this.hide();
			}
		}
	}

	@HostListener('focus', ['$event.target'])
	protected onFocus():void {
		this.provideMatches(this.modelInstance.model);
	}

	@HostListener('blur', ['$event.target'])
	protected onBlur():void {
		if (this.container.visible && !this.container.isFocused) {
			this.hide();
		}
	}

	constructor(private modelInstance:NgModel, private element:ElementRef, private appRef:ApplicationRef,
	            private viewContainer:ViewContainerRef, private resolver:ComponentResolver, private renderer:Renderer,
	            private injector:Injector) {
	}

	ngOnInit() {
		this.element.nativeElement.focus();
		this.resolver
			.resolveComponent(AutoCompleteTmplComponent)
			.then((factory:ComponentFactory<AutoCompleteTmplComponent>) => {
				let cmpRef:ComponentRef<AutoCompleteTmplComponent>;
				if (this.options.clipToBody) {
					this.addWrapperElement();
					cmpRef = factory.create(this.injector, null, `.${LIST_CONTAINER_CLASS}`);
				} else {
					cmpRef = factory.create(this.injector, this.viewContainer.element.nativeElement);
				}
				this.container = cmpRef.instance;
				this.initContainerComponent(cmpRef);
				this.element.nativeElement.focus();
			});
	}

	provideMatches(query:string) {
		let matches:Array<AutoCompleteGroup> = [];
		if (!query || query.length < this.options.minLength) {
			this.hide();
			return;
		}
		this.autoComplete.forEach((group:AutoCompleteGroup) => {
			let items:Array<any> = group.items.filter((item:string) => {
				return item.toLowerCase().indexOf(query.toLowerCase()) > -1;
			});
			if (items.length) {
				matches.push({
					name: group.name,
					items: items
				});
			}
		});
		matches.length ? this.show(matches) : this.hide();
	}

	select(query:any) {
		this.onSelected.emit(query);
		this.resetQuery();
	}

	resetQuery() {
		this.modelInstance.viewToModelUpdate('');
		this.renderer.setElementProperty(this.element.nativeElement, 'value', '');
		this.hide();
	}

	show(matches:Array<any>):void {
		this.container.visible = true;
		this.container.matches = matches;
	}

	hide() {
		if (this.container) {
			this.container.visible = false;
		}
	}

	private initContainerComponent(cmpRef:ComponentRef<AutoCompleteTmplComponent>) {
		this.container.parent = this;
		this.container.visible = false;
		this.container.cssClasses = this.options.cssClasses;
		this.container.isGrouped = this.options.isGrouped;
		this.container.setPosition(this.calculatePosition());
		if (this.options.clipToBody) {
			(<any>this.appRef)._loadComponent(cmpRef);
		}
	}

	private calculatePosition():any {
		let inputEl:any = this.element.nativeElement;
		let position:any = {
			top: null,
			left: null
		};
		if (this.options.clipToBody) {
			if (this.options.position) {
				// possible values: 'bottom', 'left', 'right'
				if (typeof this.options.position === 'string') {
					switch (this.options.position) {
						case 'bottom':
							position.top = inputEl.offsetTop + inputEl.offsetHeight + DEFAULT_OFFSET_MARGIN;
							position.left = inputEl.offsetLeft;
							break;
						case 'left':
							position.top = inputEl.offsetTop;
							position.left = inputEl.offsetLeft - inputEl.offsetWidth - DEFAULT_OFFSET_MARGIN;
							break;
						case 'right':
							position.top = inputEl.offsetTop;
							position.left = inputEl.offsetLeft + inputEl.offsetWidth + DEFAULT_OFFSET_MARGIN;
							break;
					}
				} else {
					// if we got input position is an object with 'top' and 'left' properties
					if (typeof this.options.position === 'object' && this.options.position.top && this.options.position.left) {
						position.top = this.options.position.top;
						position.left = this.options.position.left;
					}
				}
			}
			// default will be 'bottom' if position is still not set up
			if (position.top === null || position.left === null) {
				position.top = inputEl.offsetTop + inputEl.offsetHeight + DEFAULT_OFFSET_MARGIN;
				position.left = inputEl.offsetLeft;
			}
		} else {
			return null;
		}
		return position;
	}

	private addWrapperElement() {
		if (!document.querySelector(`.${LIST_CONTAINER_CLASS}`)) {
			let container:Element = document.createElement('div');
			container.setAttribute('class', LIST_CONTAINER_CLASS);
			document.querySelector('body').appendChild(container);
		}
	}
}

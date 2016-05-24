import {Component, ElementRef} from '@angular/core';
import {CORE_DIRECTIVES} from '@angular/common';
import {AutoCompleteDirective} from './auto-complete.directive';

@Component({
	selector: 'auto-complete-template',
	directives: [CORE_DIRECTIVES],
	template: `
		<div [ngClass]="cssClasses.list"
			[ngStyle]="{position: position, top: top, left: left, display: visible ? 'block' : 'none'}"
			(mouseleave)="focusLost()">
			<div *ngIf="isGrouped">
				<div *ngFor="let match of matches">
					<div [ngClass]="cssClasses.group">
						{{match.name}}
					</div>
					<div [ngClass]="cssClasses.item" *ngFor="let item of match.items"
						[class.active]="isActive(item, match.name)"
						(click)="select(item, match.name)"
						(mouseenter)="selectActive(item, match.name)"
						[innerHtml]="item"></div>
				</div>
			</div>
			<div *ngIf="!isGrouped">
				<div [ngClass]="cssClasses.item" *ngFor="let item of matches"
						[class.active]="isActive(item)"
						(click)="select(item)"
						(mouseenter)="selectActive(item)"
						[innerHtml]="item"></div>
			</div>
	</div>
	`
})
export class AutoCompleteTmplComponent {
	parent:AutoCompleteDirective;
	isFocused:boolean = false;
	isGrouped:boolean;
	top:string;
	left:string;
	visible:boolean = false;
	cssClasses:any;
	protected position:string = 'static';
	private active:any;
	private _matches:Array<any> = [];

	get matches():Array<any> {
		return this._matches;
	}

	set matches(value:Array<any>) {
		this._matches = value;
		if (this._matches.length && this._matches[0].items && this._matches[0].items.length) {
			if (this.isGrouped) {
				this.active = {
					value: this._matches[0].items[0],
					group: this._matches[0].name
				};
			} else {
				this.active = this._matches[0];
			}
		}
	}

	setPosition(position:any) {
		if (position) {
			this.position = 'absolute';
			this.top = position.top;
			this.left = position.left;
		} else {
			this.position = 'static';
			this.top = null;
			this.left = null;
		}
	}

	nextActiveItem() {
		if (this.isGrouped) {
			this._matches.every((group:any, indexGroup:number) => {
				if (group.name === this.active.group) {
					group.items.every((value:any, indexItem:number) => {
						if (value === this.active.value) {
							if (indexItem < group.items.length - 1) {
								this.active.value = group.items[indexItem + 1];
							} else if (indexGroup < this._matches.length - 1) {
								this.active.value = this._matches[indexGroup + 1].items[0];
								this.active.group = this._matches[indexGroup + 1].name;
							} else {
								this.active.value = this._matches[0].items[0];
								this.active.group = this._matches[0].name;
							}
							return false;
						}
						return true;
					});
					return false;
				}
				return true;
			});
		} else {
			this._matches.every((match:any, i:number) => {
				if (match === this.active) {
					if (i < this._matches.length - 1) {
						this.active = this._matches[i + 1];
					} else {
						this.active = this._matches[0];
					}
					return false;
				}
				return true;
			});
		}
	}

	previousActiveItem() {
		if (this.isGrouped) {
			this._matches.every((group:any, indexGroup:number) => {
				if (group.name === this.active.group) {
					group.items.every((value:any, indexItem:number) => {
						if (value === this.active.value) {
							if (indexItem > 0) {
								this.active.value = group.items[indexItem - 1];
							} else if (indexGroup > 0) {
								let prevGroup = this._matches[indexGroup - 1];
								this.active.value = prevGroup.items[prevGroup.items.length - 1];
								this.active.group = prevGroup.name;
							} else {
								let lastGroup = this._matches[this._matches.length - 1];
								this.active.value = lastGroup.items[lastGroup.items.length - 1];
								this.active.group = lastGroup.name;
							}
							return false;
						}
						return true;
					});
					return false;
				}
				return true;
			});
		} else {
			this._matches.every((match:any, i:number) => {
				if (match === this.active) {
					if (i > 1) {
						this.active = this._matches[i - 1];
					} else {
						this.active = this._matches[this._matches.length - 1];
					}
					return false;
				}
				return true;
			});
		}
	}

	selectActiveItem() {
		this.parent.select(this.active);
	}

	protected isActive(value:string, valueGroupName?:string):boolean {
		return this.isGrouped ? this.active.value === value && this.active.group === valueGroupName :
			this.active;
	}

	protected select(item:string, group?:string) {
		if (this.isGrouped) {
			this.parent.select({
				value: item,
				group: group
			});
		} else {
			this.parent.select(item);
		}
	}

	protected selectActive(value:string, valueGroupName?:string):void {
		this.isFocused = true;
		if (this.isGrouped) {
			this.active = {
				value: value,
				group: valueGroupName
			};
		} else {
			this.active = value;
		}
	}

	protected focusLost():void {
		this.isFocused = false;
	}
}

import { styled } from '@mui/material';
import { Component, createRef, ReactNode } from 'react';

const ScrollingListDiv = styled('div')(({ theme }) => ({
	position: 'relative',
	display: 'flex',
	flexDirection: 'column',
	maxHeight: 'inherit',
	height: 'inherit',
	overflowY: 'auto',
	padding: theme.spacing(1)
}));

const SCROLL_OFFSET_TRIGGER = 2;

interface ScrollingListProps {
	// eslint-disable-next-line no-unused-vars
	onScroll?: (isAtBottom: boolean) => void;
}

type ScrollingListComponentProps =
	Readonly<{ children?: ReactNode }> & Readonly<ScrollingListProps>;

class ScrollingList extends Component<ScrollingListProps> {
	private readonly wrapperRef: React.RefObject<HTMLDivElement>;
	private readonly bottomRef: React.RefObject<HTMLDivElement>;

	constructor(props: ScrollingListProps) {
		super(props);

		this.bottomRef = createRef();
		this.wrapperRef = createRef();
		this.handleScroll = this.handleScroll.bind(this);
	}

	animateScroll(element: HTMLElement, offset: number): void {
		if (element.scrollBy)
			element.scrollBy({ top: offset });
		else
			element.scrollTop = offset;
	}

	getSnapshotBeforeUpdate(): boolean {
		if (this.wrapperRef.current && this.bottomRef.current) {
			return ScrollingList.isViewable(
				this.wrapperRef.current,
				this.bottomRef.current,
				SCROLL_OFFSET_TRIGGER
			);
		}

		return false;
	}

	componentDidUpdate(
		// eslint-disable-next-line
		_previousProps: ScrollingListComponentProps,
		// eslint-disable-next-line
		_previousState: any,
		snapshot: boolean
	): void {
		if (
			snapshot &&
			this.bottomRef.current &&
			this.wrapperRef.current
		)
			this.scrollParentToChild(this.wrapperRef.current, this.bottomRef.current);
	}

	componentDidMount(): void {
		if (this.bottomRef.current && this.wrapperRef.current)
			this.scrollParentToChild(this.wrapperRef.current, this.bottomRef.current);
	}

	protected scrollParentToChild(parent: HTMLElement, child: HTMLElement): void {
		if (!ScrollingList.isViewable(parent, child, SCROLL_OFFSET_TRIGGER)) {
			const parentRect = parent.getBoundingClientRect();
			const childRect = child.getBoundingClientRect();
			const scrollOffset = (childRect.top + parent.scrollTop) - parentRect.top;

			this.animateScroll(parent, scrollOffset);
		}
	}

	private static isViewable(
		parent: HTMLElement,
		child: HTMLElement,
		scrollOffsetTrigger = 2
	): boolean {
		const parentRect = parent.getBoundingClientRect();
		const childRect = child.getBoundingClientRect();
		const childTopIsViewable = (childRect.top >= parentRect.top);
		const childOffsetToParentBottom =
			parentRect.top + parent.clientHeight - childRect.top;
		const childBottomIsViewable = childOffsetToParentBottom + scrollOffsetTrigger >= 0;

		return childTopIsViewable && childBottomIsViewable;
	}

	protected handleScroll(): void {
		const { onScroll } = this.props;

		if (onScroll && this.bottomRef.current && this.wrapperRef.current) {
			const isAtBottom = ScrollingList.isViewable(
				this.wrapperRef.current,
				this.bottomRef.current,
				SCROLL_OFFSET_TRIGGER
			);

			onScroll(isAtBottom);
		}
	}

	public scrollToBottom(): void {
		if (this.bottomRef.current && this.wrapperRef.current)
			this.scrollParentToChild(this.wrapperRef.current, this.bottomRef.current);
	}

	render(): React.ReactNode {
		const { children } = this.props;

		return (
			<ScrollingListDiv ref={this.wrapperRef} onScroll={this.handleScroll}>
				{children}

				<div ref={this.bottomRef} />
			</ScrollingListDiv>
		);
	}
}

export default ScrollingList;

import { Component, OnInit } from '@angular/core';
import { DragulaService } from 'ng2-dragula';
import { DefiService } from 'src/app/services/defi.service';
import { ApiPairListResponse } from 'src/app/models/defi';

@Component({
  selector: 'app-tags',
  templateUrl: './tags.component.html',
  styleUrls: ['./tags.component.scss']
})
export class TagsComponent implements OnInit {
  newTagName: string;
  activeTags = [];
  inActiveTags = [];
  groupNames: Array<string> = [];
  grupNamesOptions = {};

  constructor(
    private dragulaService: DragulaService,
    private defiService: DefiService
  ) {
    if (!this.dragulaService.find('TAGS')) {
      dragulaService.createGroup('TAGS', {
        moves: (el, container, handle) => {
          return handle.className === 'handle';
        }
      });
    }
  }

  ngOnInit(): void {
    this.defiService.getPairLists().subscribe(res => {
      this.activeTags = res.lists.filter(tag => tag.active);
      this.inActiveTags = res.lists.filter(tag => !tag.active);

      const groupNamesSet = new Set<string>();
      res.lists.forEach(tag => {
        this.grupNamesOptions[tag.id] = {
          editingMode: false,
          editingName: false
        };
        tag.groupName = tag.groupName ?? '-1';
        groupNamesSet.add(tag.groupName);
      });
      this.groupNames = [...groupNamesSet.values()].sort((a, b) => a.localeCompare(b));
      console.log(this.groupNames, 'this.groupNames');
    });
    this.dragulaService.dropModel('TAGS').subscribe(args => {
      const groupName = args.item.groupName === '-1' ? '' : args.item.groupName;
      switch (args.source.id + '_' + args.target.id) {
        case 'left_left':
          setTimeout(() => {
            this.activeTags[args.sourceIndex].position = args.targetIndex;
            this.activeTags[args.targetIndex].position = args.sourceIndex;
            this.updateActiveTagList();
          }, 0);
          break;
        case 'left_right':
          this.updateTag(args.item.id, args.item.name, groupName, -1, false, args.item.isFeatured)
            .then((res: ApiPairListResponse) => {
              if (res.ok) {
                args.item.active = false;
                args.item.position = -1;
                this.updateActiveTagList();
              }
            });
          break;
        case 'right_left':
          this.updateTag(args.item.id, args.item.name, groupName, args.targetIndex, true, args.item.isFeatured)
            .then((res: ApiPairListResponse) => {
              if (res.ok) {
                args.item.active = true;
                args.item.position = args.targetIndex;
                this.updateActiveTagList();
              }
            });
          break;
        // case 'right_right': Nothing changed
      }
    });
  }

  addTag(): void {
    this.defiService.createPairList(this.newTagName, '', this.activeTags.length, false).subscribe(res => {
      if (res.ok) {
        this.newTagName = '';
        this.activeTags.push(res.list);
      }
    });
  }

  updateIsFeatured(tag): void {
    const groupName = tag.groupName === '-1' ? '' : tag.groupName;
    this.updateTag(tag.id, tag.name, groupName, tag.position, tag.active, !tag.isFeatured).then((res: ApiPairListResponse) => {
      if (res.ok) {
        tag.isFeatured = !tag.isFeatured;
      }
    });
  }

  updateActive(tag, index): void {
    const groupName = tag.groupName === '-1' ? '' : tag.groupName;
    const position = tag.active ? -1 : this.activeTags.length;
    this.updateTag(tag.id, tag.name, groupName, position, !tag.active, tag.isFeatured).then((res: ApiPairListResponse) => {
      if (res.ok) {
        if (tag.active) {
          tag.position = -1;
          tag.active = !tag.active;
          this.inActiveTags.push(tag);
          this.activeTags.splice(index, 1);
          this.updateActiveTagList();
        } else {
          tag.position = this.activeTags.length;
          tag.active = !tag.active;
          this.inActiveTags.splice(index, 1);
          this.activeTags.push(tag);
        }
      }
    });
  }

  updateActiveTagList(): void {
    this.activeTags.map((tag, index) => {
      if (tag.position !== index) {
        const groupName = tag.groupName || '';
        this.updateTag(tag.id, tag.name, groupName, index, tag.active, tag.isFeatured).then();
      }
    });
  }

  updateInActiveTagList(): void {
    this.inActiveTags.map(tag => {
      const groupName = tag.groupName === '-1' ? '' : tag.groupName;
      this.updateTag(tag.id, tag.name, groupName, -1, false, tag.isFeatured).then();
    });
  }

  selectTagGroup(tag, groupName): void {
    if (tag.groupName !== groupName) {
      groupName = groupName === '-1' ? '' : groupName;
      this.updateTag(tag.id, tag.name, groupName, tag.position, tag.active, tag.isFeatured)
        .then((res: ApiPairListResponse) => {
          if (res.ok) {
            tag.groupName = groupName ? groupName : 'No Group';
          }
        });
    }
  }

  editGroupName(id: string): void {
    this.grupNamesOptions[id].editingMode = !this.grupNamesOptions[id].editingMode;
  }

  editTagName(id: string): void {
    this.grupNamesOptions[id].editingName = !this.grupNamesOptions[id].editingName;
  }

  updateTagName(tag, tagName): void {
    if (tagName && tagName !== tag.name) {
      const groupName = tag.groupName === '-1' ? '' : tag.groupName;
      this.updateTag(tag.id, tagName, groupName, tag.position, tag.active, tag.isFeatured)
        .then((res: ApiPairListResponse) => {
          if (res.ok) {
            this.grupNamesOptions[tag.id].editingName = false;
            tag.name = tagName;
          }
        });
    } else if (tagName === tag.name) {
      this.grupNamesOptions[tag.id].editingName = false;
    }
  }

  saveGroupName(groupName: string, tag): void {
    if (groupName && groupName !== '-1') {
      const groupNamesSet = new Set<string>();
      this.groupNames.map(groupN => groupNamesSet.add(groupN));
      groupNamesSet.add(groupName);
      this.groupNames = [...groupNamesSet.values()].sort((a, b) => a.localeCompare(b));
      this.updateTag(tag.id, tag.name, groupName, tag.position, tag.active, tag.isFeatured)
        .then((res: ApiPairListResponse) => {
          if (res.ok) {
            tag.groupName = groupName;
            this.grupNamesOptions[tag.id].editingMode = false;
          }
        });
    }
  }

  updateTag(
    id: string, name: string, groupName: string, position: number, active: boolean, isFeatured: boolean
  ): Promise<ApiPairListResponse> {
    return this.defiService.updatePairList(id, name, groupName, position, active, isFeatured).toPromise();
  }
}

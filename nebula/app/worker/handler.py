import os
import shortuuid
from pathlib import Path
from starlette.responses import FileResponse
from PIL import Image, ImageFile, ExifTags
import httpx
from ..util.tracer import get_logger, pretty_dumps

ImageFile.LOAD_TRUNCATED_IMAGES = True

class FileHandler:

    white_event = 'magellan:white-capture'
    thumbnail_size = int(os.getenv('THUMBNAIL_SIZE', 192))

    def __init__(self, facility_id):
        self.path_to_media = f'/media/{facility_id}'
        self.path_to_body = f'{self.path_to_media}/body'
        self.path_to_thumbnail = f'{self.path_to_media}/thumbnail'
        self.path_to_pdf = f'{self.path_to_media}/pdf'

    def generate_unique_filename(self, filename):
        ext = filename.split('.')[-1] # file extension
        return f'{shortuuid.uuid()}.{ext}'
    
    def create_path_to_body(self, filename):
        bdir = Path(self.path_to_body)
        bdir.mkdir(parents=True, exist_ok=True)
        return bdir / filename
    
    def create_path_to_thumbnail(self, filename):
        tdir = Path(self.path_to_thumbnail)
        tdir.mkdir(parents=True, exist_ok=True)
        return tdir / filename
    
    def create_path_to_pdf(self, filename):
        pdir = Path(self.path_to_pdf)
        pdir.mkdir(parents=True, exist_ok=True)
        return pdir / filename

    async def save_file(self, filename, contents):
        body_name = self.generate_unique_filename(filename)
        body_path = self.create_path_to_body(body_name)
        
        with open(body_path, "wb") as f:
            f.write(contents)
            
            thumbnail_name = self.generate_unique_filename(filename)
            thumbnail_path = self.create_path_to_thumbnail(thumbnail_name)
            image = Image.open(body_path) # open image
            image.thumbnail((self.thumbnail_size, self.thumbnail_size), resample=3) # generate thumbnail image
            image.save(thumbnail_path) # save thumbnail image
        
        return {"thumbnail": thumbnail_name, 'body': body_name, 'filename': filename}

    async def save_pdf(self, filename, contents):
        body_name = self.generate_unique_filename(filename)
        body_path = self.create_path_to_pdf(body_name)
        with body_path.open("wb") as f:
            f.write(contents)
        return {'body': body_name, 'filename': filename}

    async def save_capture(self, filename, channel, contents):
        body_name = self.generate_unique_filename(filename)
        body_path = self.create_path_to_body(body_name)
        
        with open(body_path, "wb") as f:
            f.write(contents)

            image = Image.open(body_path)
            for orientation in ExifTags.TAGS.keys():
                if ExifTags.TAGS[orientation] == 'Orientation':
                    break
            exif = image._getexif()

            if exif[orientation] == 3:
                image = image.rotate(180, expand=True)
            elif exif[orientation] == 6:
                image = image.rotate(270, expand=True)
            elif exif[orientation] == 8:
                image = image.rotate(90, expand=True)

            image.save(body_path)

            thumbnail_name = self.generate_unique_filename(filename)
            thumbnail_path = self.create_path_to_thumbnail(thumbnail_name)

            image.thumbnail((self.thumbnail_size, self.thumbnail_size), resample=3)
            image.save(thumbnail_path)
            image.close()
            file_size = os.path.getsize(body_path)

        # const {thumbnail, body, filename, size, type} = data;
        ext = body_name.split('.')[-1]
        data = {'thumbnail': thumbnail_name, 'body': body_name, 'filename': filename, 'type': ext, 'size': file_size}
        event_data = {
            'channel': channel,
            'event': self.white_event,
            'data_id': data
        }
        topic_url = os.getenv('URL_FOR_PUSH_TOPIC')
        headers = {'Content-Type': 'application/json'}
        async with httpx.AsyncClient() as client:
            await client.post(topic_url, json=event_data, headers=headers)
        
        return data

    async def delete_file(self, thumbnail, body):
        thumbnail_path = Path(f'{self.path_to_thumbnail}/{thumbnail}')
        body_path = Path(f'{self.path_to_body}/{body}')
        try:
            thumbnail_path.unlink()
            body_path.unlink()
        except OSError as e:
            get_logger(__name__).warning("Error: %s : %s" % (thumbnail_path, e.strerror))
        else:
            return {'count': 2}

    async def delete_pdf(self, pdf):
        pdf_path = Path(f'{self.path_to_pdf}/{pdf}')
        try:
            pdf_path.unlink()
        except OSError as e:
            get_logger(__name__).warning("Error: %s : %s" % (pdf_path, e.strerror))
        else:
            return {'count': 1}

    async def get_body(self, pk):
        return FileResponse(f'{self.path_to_body}/{pk}')

    async def get_thumbnail(self, pk):
        return FileResponse(f'{self.path_to_thumbnail}/{pk}')
    
    async def get_pdf(self, pk: str):
        return FileResponse(f'{self.path_to_pdf}/{pk}')

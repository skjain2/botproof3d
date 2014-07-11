module SubmissionsHelper
	def image_stl
		image_name = @submission.image.to_s.split("/").last
	 	if (image_name.count('stl') || image_name.count('STL'))
        	image_name+".stl"
      	else
        	image_name
    	end
    end
	def before_url_helper
		#after_url_raw = AWS::S3::S3Object.url_for("stl", "botproof3d/#{@submission.id}/fixed", use_ssl: true)
		#after_url_raw = AWS::S3::S3Object.url_for("stl", "botproof3d/#{@submission.id}/fixed", use_ssl: true)
		Bucket.objects(:prefix => "#{@submission.id}/src").each do |obj|
			begin
				if obj.key.index('stl')
					p obj.key
					return AWS::S3::S3Object.url_for("#{obj.key}", "botproof3d", use_ssl: true)
				end
			rescue e
				return root_path
			end
		end
		return root_path
	end
	def after_url_helper
		#after_url_raw = AWS::S3::S3Object.url_for("stl", "botproof3d/#{@submission.id}/fixed", use_ssl: true)
		Bucket.objects(:prefix => "#{@submission.id}/fixed").each do |obj|
			begin
				if obj.key.index('stl')
					return AWS::S3::S3Object.url_for("#{obj.key}", "botproof3d", use_ssl: true)
				end
			rescue e
				return root_path
			end
		end
		return root_path
	end
	def before_loader
		aws_url=before_url_helper
		base = "_stl(\"before\").init(\"#{aws_url}\", 0xff0000"
		if aws_url.index('-asc')
			return base+", 'ascii')"
		elsif aws_url.index('-bin')
			return base+", 'binary')"
		else
			return base+")"
		end
	end
	def after_loader
		aws_url=after_url_helper
		base = "_stl(\"after\").init(\"#{aws_url}\", 0x00ff00"
		if aws_url.index('-asc')
			return base+", 'ascii')"
		elsif aws_url.index('-bin')
			return base+", 'binary')"
		else
			return base+")"
		end
	end
end
